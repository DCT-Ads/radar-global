import * as cheerio from "cheerio";
import { jvzooCanonicalUrl, jvzooPidFromUrl } from "./adapter";
import { fetchHtml, REQUEST_GAP_MS, RobotsBlockedError, sleep } from "./http";
import {
  emptyResult,
  type MarketplaceCollectResult,
  type MarketplaceLaunch,
} from "./types";

const LISTING = "https://www.jvzoomarket.com/listings?sort=newest";
const ORIGIN = "https://www.jvzoomarket.com";
const PAGE_SIZE = 10;
const MAX_START = 2000;

function absoluteUrl(href: string | undefined) {
  if (!href) {
    return null;
  }
  try {
    return new URL(href, ORIGIN).toString();
  } catch {
    return null;
  }
}

function extractPid(fromInput: string | undefined, href: string | undefined) {
  const input = fromInput?.trim();
  if (input && /^\d+$/.test(input)) {
    return input;
  }
  return href ? jvzooPidFromUrl(absoluteUrl(href) ?? href) : null;
}

function dedupeByPid(items: MarketplaceLaunch[]) {
  const seen = new Set<string>();
  const out: MarketplaceLaunch[] = [];
  for (const item of items) {
    const pid = jvzooPidFromUrl(item.url);
    if (!pid || seen.has(pid)) {
      continue;
    }
    seen.add(pid);
    out.push(item);
  }
  return out;
}

function parseItems(html: string, scrapedAt: string): MarketplaceLaunch[] {
  const $ = cheerio.load(html);
  const items: MarketplaceLaunch[] = [];
  const seen = new Set<string>();

  $(".prod-list-item").each((_, el) => {
    const node = $(el);
    const title = node.find(".prod-list-title").first();
    const product = title.text().replace(/\s+/g, " ").trim();
    const pid = extractPid(node.find("input#pid").first().attr("value"), title.attr("href"));
    if (!product || !pid) {
      return;
    }
    if (seen.has(pid)) {
      return;
    }
    seen.add(pid);
    const vendor =
      node.find(".prod-list-seller a").first().text().replace(/\s+/g, " ").trim() ||
      null;
    const niche =
      node.find(".prod-list-category").first().text().replace(/\s+/g, " ").trim() ||
      null;

    items.push({
      source: "jvzoo",
      product_name: product,
      vendor,
      launch_date: null,
      status: "evergreen",
      niche,
      url: jvzooCanonicalUrl(pid),
      raw_scraped_at: scrapedAt,
    });
  });

  return items;
}

function lastStartFromHtml(html: string): number {
  const $ = cheerio.load(html);
  const matches = [...$(".pagination a.page-link").toArray()]
    .map((el) => $(el).attr("href") ?? "")
    .flatMap((href) => [...href.matchAll(/start=(\d+)/g)].map((m) => Number(m[1])));
  return matches.length ? Math.max(...matches) : 0;
}

export async function collectJvzoo(options?: {
  maxPages?: number;
}): Promise<MarketplaceCollectResult> {
  const errors: string[] = [];
  const collected: MarketplaceLaunch[] = [];
  const scrapedAt = new Date().toISOString();
  let httpStatus: number | null = null;
  let finalUrl: string | null = null;

  try {
    const first = await fetchHtml(LISTING);
    httpStatus = first.status;
    finalUrl = first.url;
    if (!first.ok) {
      const message = `jvzoo HTTP ${first.status}`;
      errors.push(message);
      console.error(`[jvzoo] ${message}`);
      return emptyResult("jvzoo", {
        errors,
        httpStatus,
        finalUrl,
        emptyReason: message,
      });
    }

    const firstItems = parseItems(first.html, scrapedAt);
    collected.push(...firstItems);
    const pageCap =
      options?.maxPages && options.maxPages > 0
        ? (options.maxPages - 1) * PAGE_SIZE
        : MAX_START;
    const lastStart = Math.min(lastStartFromHtml(first.html), pageCap);

    for (let start = PAGE_SIZE; start <= lastStart; start += PAGE_SIZE) {
      await sleep(REQUEST_GAP_MS);
      const pageUrl = `${ORIGIN}/productlibrary/listings?sort=newest&start=${start}`;
      try {
        const res = await fetchHtml(pageUrl);
        httpStatus = res.status;
        finalUrl = res.url;
        if (!res.ok) {
          errors.push(`jvzoo HTTP ${res.status} em start=${start}`);
          break;
        }
        const pageItems = parseItems(res.html, scrapedAt);
        console.log(`[jvzoo] start=${start} itens_pagina=${pageItems.length}`);
        if (!pageItems.length) {
          break;
        }
        collected.push(...pageItems);
      } catch (error) {
        errors.push(
          `jvzoo start=${start}: ${error instanceof Error ? error.message : "falhou"}`,
        );
        console.error(`[jvzoo] start=${start} falhou, seguindo`);
      }
    }

    const items = dedupeByPid(collected);
    console.log(`[jvzoo] coletados=${items.length} erros=${errors.length}`);
    return {
      source: "jvzoo",
      items,
      errors,
      httpStatus,
      finalUrl,
      emptyReason: items.length ? null : errors[0] ?? "HTML sem .prod-list-item",
    };
  } catch (error) {
    const message =
      error instanceof RobotsBlockedError
        ? error.message
        : error instanceof Error
          ? error.message
          : "jvzoo falhou";
    errors.push(message);
    console.error(`[jvzoo] erro: ${message}`);
    return emptyResult("jvzoo", {
      errors,
      httpStatus,
      finalUrl,
      emptyReason: message,
    });
  }
}
