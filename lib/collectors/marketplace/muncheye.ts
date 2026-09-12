import * as cheerio from "cheerio";
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

function parseItems(html: string, scrapedAt: string): MarketplaceLaunch[] {
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

    items.push({
      source: "muncheye",
      product_name: product,
      vendor,
      launch_date: launchDate,
      status: statusFromLaunchDate(launchDate),
      niche: null,
      url,
      raw_scraped_at: scrapedAt,
    });
  });

  return items;
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
      const pageItems = parseItems(res.html, scrapedAt);
      if (!pageItems.length) {
        if (page === 1) {
          errors.push("muncheye: HTML sem .item com product name");
        }
        break;
      }
      collected.push(...pageItems);
    }

    const items = dedupeLaunches(collected);
    console.log(`[muncheye] coletados=${items.length} erros=${errors.length}`);
    return {
      source: "muncheye",
      items,
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
