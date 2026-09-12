import { REQUEST_GAP_MS, sleep } from "./http";
import { warriorplusOfferKey } from "./adapter";
import {
  dedupeLaunches,
  emptyResult,
  statusFromLaunchDate,
  type MarketplaceCollectResult,
  type MarketplaceLaunch,
} from "./types";

const HOME = "https://warriorplus.com/marketplace/home";
const FETCH_MARKETPLACE = "fetch-marketplace.php";
const ORIGIN = "https://warriorplus.com";

export type WarriorplusCollectOptions = {
  /** Home only. Default 3 (teste pequeno). */
  maxPages?: number;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function parseWarriorplusMarketplaceJson(
  payload: unknown,
  scrapedAt: string,
): MarketplaceLaunch[] {
  const root = asRecord(payload);
  const rows = Array.isArray(root?.data) ? root.data : [];
  const items: MarketplaceLaunch[] = [];

  for (const row of rows) {
    const rec = asRecord(row);
    if (!rec) {
      continue;
    }
    const offerLink = asString(rec.offer_link);
    const name = asString(rec.offer_name);
    if (!offerLink || !name) {
      continue;
    }
    const key = warriorplusOfferKey(offerLink);
    if (!key) {
      continue;
    }
    const url = new URL(offerLink, ORIGIN).toString();
    const launchDate = asString(rec.offer_date);

    items.push({
      source: "warriorplus",
      product_name: name,
      vendor: asString(rec.vendor_name),
      launch_date: launchDate,
      status: statusFromLaunchDate(launchDate),
      niche: null,
      url,
      raw_scraped_at: scrapedAt,
    });
  }

  return items;
}

function marketplacePageUrl(page: number, limit: number) {
  const url = new URL("/include/ajax/fetch-marketplace.php", ORIGIN);
  url.searchParams.set("p", String(page));
  url.searchParams.set("l", String(limit));
  return url.toString();
}

export async function collectWarriorplus(
  options: WarriorplusCollectOptions = {},
): Promise<MarketplaceCollectResult> {
  const maxPages = Math.max(1, options.maxPages ?? 3);
  const scrapedAt = new Date().toISOString();
  const errors: string[] = [];
  const collected: MarketplaceLaunch[] = [];

  try {
    const { chromium } = await import("playwright");
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    });

    let firstLimit = 25;
    const seenPages = new Set<number>();

    page.on("response", async (response) => {
      try {
        if (!response.ok() || !response.url().includes(FETCH_MARKETPLACE)) {
          return;
        }
        const json = await response.json();
        collected.push(...parseWarriorplusMarketplaceJson(json, scrapedAt));
        const parsed = new URL(response.url());
        const p = Number(parsed.searchParams.get("p") ?? "1");
        const l = Number(parsed.searchParams.get("l") ?? "25");
        if (Number.isFinite(l) && l > 0) {
          firstLimit = l;
        }
        if (Number.isFinite(p)) {
          seenPages.add(p);
        }
      } catch (error) {
        errors.push(
          `xhr: ${error instanceof Error ? error.message : "json inválido"}`,
        );
      }
    });

    await page.goto(HOME, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.waitForResponse(
      (response) => response.ok() && response.url().includes(FETCH_MARKETPLACE),
      { timeout: 20_000 },
    );
    await page.waitForTimeout(500);

    for (let pageNum = 2; pageNum <= maxPages; pageNum += 1) {
      if (seenPages.has(pageNum)) {
        continue;
      }
      await sleep(REQUEST_GAP_MS);
      const res = await page.request.get(marketplacePageUrl(pageNum, firstLimit), {
        headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
      });
      if (!res.ok()) {
        errors.push(`warriorplus HTTP ${res.status()} em p=${pageNum}`);
        break;
      }
      const json = await res.json();
      const pageItems = parseWarriorplusMarketplaceJson(json, scrapedAt);
      console.log(`[warriorplus] p=${pageNum} itens_pagina=${pageItems.length}`);
      if (!pageItems.length) {
        break;
      }
      collected.push(...pageItems);
    }

    await browser.close();

    const items = dedupeLaunches(collected);
    console.log(`[warriorplus] coletados=${items.length} erros=${errors.length}`);
    return {
      source: "warriorplus",
      items,
      errors,
      httpStatus: 200,
      finalUrl: HOME,
      emptyReason: items.length ? null : errors[0] ?? "XHR sem ofertas",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "warriorplus falhou";
    errors.push(message);
    console.error(`[warriorplus] erro: ${message}`);
    return emptyResult("warriorplus", {
      errors,
      emptyReason: message,
      finalUrl: HOME,
    });
  }
}
