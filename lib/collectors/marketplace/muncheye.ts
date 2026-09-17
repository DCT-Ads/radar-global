import * as cheerio from "cheerio";
import { keywordFromText } from "@/lib/niches";
import { fetchHtml, REQUEST_GAP_MS, RobotsBlockedError, sleep } from "./http";
import {
  dedupeLaunches,
  emptyResult,
  statusFromLaunchDate,
  type MarketplaceCollectResult,
  type MarketplaceLaunch,
} from "./types";

const HOME = "https://muncheye.com/";
const MAX_PAGES = 6;
const BLOCKED_HOSTS = new Set([
  "muncheye.com",
  "www.muncheye.com",
  "fonts.googleapis.com",
  "maxcdn.bootstrapcdn.com",
  "facebook.com",
  "www.facebook.com",
  "google.com",
  "www.google.com",
  "calendar.google.com",
  "twitter.com",
  "x.com",
  "linkedin.com",
  "instagram.com",
  "youtube.com",
  "www.youtube.com",
  "letsgolook.at",
  "dev.visualwebsiteoptimizer.com",
]);

function absoluteMuncheyeUrl(href: string | undefined) {
  if (!href) {
    return null;
  }
  try {
    return new URL(href, HOME).toString();
  } catch {
    return null;
  }
}

export function parseMuncheyeItems(html: string, scrapedAt: string): MarketplaceLaunch[] {
  const $ = cheerio.load(html);
  const items: MarketplaceLaunch[] = [];

  $(".item").each((_, el) => {
    const node = $(el);
    const product =
      node.find("meta[itemprop='name']").attr("content")?.trim() ||
      node.find("a[rel='bookmark']").text().split(":").slice(1).join(":").trim();
    if (!product) {
      return;
    }
    const href = node.find("a[rel='bookmark']").attr("href");
    const url = absoluteMuncheyeUrl(href);
    if (!url) {
      return;
    }
    const linkText = node.find("a[rel='bookmark']").text().trim();
    const vendor = linkText.includes(":")
      ? linkText.split(":")[0]?.trim() || null
      : null;
    const launchDate =
      node.find("meta[itemprop='releaseDate']").attr("content")?.trim() || null;

    const inferred = keywordFromText(product, vendor);
    items.push({
      source: "muncheye",
      product_name: product,
      vendor,
      launch_date: launchDate,
      status: statusFromLaunchDate(launchDate),
      niche: inferred.niche,
      keyword: inferred.keyword,
      url,
      raw_scraped_at: scrapedAt,
    });
  });

  return items;
}

function hostFromHref(href: string | undefined) {
  if (!href) {
    return null;
  }
  try {
    const url = new URL(href, HOME);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }
    const host = url.hostname.replace(/^www\./, "");
    if (BLOCKED_HOSTS.has(host) || BLOCKED_HOSTS.has(url.hostname)) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

/** URL do produto (JV Page). Nunca devolve muncheye.com nem slug. */
export function extractMuncheyeLandingUrl(html: string): string | null {
  const $ = cheerio.load(html);
  const jvCell = $("td")
    .filter((_, el) => /jv\s*page/i.test($(el).text()))
    .first();
  const fromJv = hostFromHref(
    jvCell.next("td").find("a[href]").attr("href") ??
      jvCell.parent().find("a[href]").attr("href"),
  );
  if (fromJv) {
    return fromJv;
  }

  let found: string | null = null;
  $("a[href]").each((_, el) => {
    if (found) {
      return;
    }
    found = hostFromHref($(el).attr("href"));
  });
  return found;
}

export async function collectMuncheye(): Promise<MarketplaceCollectResult> {
  const errors: string[] = [];
  const collected: MarketplaceLaunch[] = [];
  const scrapedAt = new Date().toISOString();
  let httpStatus: number | null = null;
  let finalUrl: string | null = null;

  try {
    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const url = page === 1 ? HOME : `https://muncheye.com/page/${page}`;
      if (page > 1) {
        await sleep(REQUEST_GAP_MS);
      }
      const res = await fetchHtml(url);
      httpStatus = res.status;
      finalUrl = res.url;
      if (!res.ok) {
        errors.push(`muncheye HTTP ${res.status} em ${url}`);
        break;
      }
      const pageItems = parseMuncheyeItems(res.html, scrapedAt);
      if (!pageItems.length) {
        if (page === 1) {
          errors.push("muncheye: HTML sem .item com product name");
        }
        break;
      }
      collected.push(...pageItems);
    }

    const listed = dedupeLaunches(collected);
    const items: MarketplaceLaunch[] = [];
    for (const item of listed) {
      await sleep(REQUEST_GAP_MS);
      try {
        const article = await fetchHtml(item.url);
        const landing = extractMuncheyeLandingUrl(article.html);
        if (!landing) {
          errors.push(`sem domínio real: ${item.product_name}`);
          continue;
        }
        items.push({ ...item, url: landing });
      } catch (error) {
        errors.push(
          `${item.product_name}: ${error instanceof Error ? error.message : "artigo falhou"}`,
        );
      }
    }

    console.log(`[muncheye] coletados=${items.length} erros=${errors.length}`);
    return {
      source: "muncheye",
      items,
      listed: listed.length,
      errors,
      httpStatus,
      finalUrl,
      emptyReason: items.length ? null : errors[0] ?? "nenhum item parseado",
    };
  } catch (error) {
    const message =
      error instanceof RobotsBlockedError
        ? error.message
        : error instanceof Error
          ? error.message
          : "muncheye falhou";
    errors.push(message);
    console.error(`[muncheye] erro: ${message}`);
    return emptyResult("muncheye", {
      errors,
      httpStatus,
      finalUrl,
      emptyReason: message,
    });
  }
}
