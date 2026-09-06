import { ALL_KEYWORDS, nicheForKeyword } from "@/lib/niches";
import { cleanHost } from "./domains";

export const DIGISTORE24_SOURCE = "digistore24";
export const DIGISTORE24_API_URL =
  "https://www.digistore24.com/api/call/listMarketplaceEntries";

export type Digistore24Hit = {
  entryId: string;
  headline: string;
  keyword: string;
  niche: string;
  url: string;
  domain: string | null;
  discoveredAt: Date;
};

export type Digistore24FetchFn = (input: {
  url: string;
  apiKey: string;
}) => Promise<unknown>;

type RawEntry = Record<string, unknown>;

function asRecord(value: unknown): RawEntry | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as RawEntry)
    : null;
}

function asString(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return null;
}

function entryId(entry: RawEntry): string | null {
  return asString(entry.id) ?? asString(entry.entry_id) ?? asString(entry.entryId);
}

function entryHeadline(entry: RawEntry): string {
  return (
    asString(entry.headline) ??
    asString(entry.title) ??
    asString(entry.name) ??
    asString(entry.product_name) ??
    ""
  );
}

function entryHaystack(entry: RawEntry): string {
  return [
    entryHeadline(entry),
    asString(entry.description),
    asString(entry.category),
    asString(entry.vendor),
    asString(entry.owner_name),
    asString(entry.ownerName),
    asString(entry.language),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function entryUrl(entry: RawEntry, id: string): string {
  return (
    asString(entry.sales_page) ??
    asString(entry.salesPage) ??
    asString(entry.salespage_url) ??
    asString(entry.url) ??
    `https://www.digistore24.com/product/${encodeURIComponent(id)}`
  );
}

function entryDomain(url: string): string | null {
  try {
    return cleanHost(new URL(url).hostname);
  } catch {
    return null;
  }
}

function matchKeyword(text: string, keywords: string[]): string | null {
  for (const keyword of keywords) {
    if (text.includes(keyword)) {
      return keyword;
    }
  }
  return null;
}

function extractEntries(payload: unknown): RawEntry[] {
  const root = asRecord(payload);
  if (!root) {
    throw new Error("Digistore24 response is not an object");
  }
  const result = asString(root.result)?.toLowerCase();
  if (result && result !== "success") {
    throw new Error(asString(root.message) ?? `Digistore24 result=${result}`);
  }
  const data = asRecord(root.data);
  const list = root.entries ?? data?.entries ?? root.data;
  if (!Array.isArray(list)) {
    throw new Error("Digistore24 response has no entries[]");
  }
  return list.filter((item): item is RawEntry => Boolean(asRecord(item)));
}

export function parseDigistore24Hits(
  payload: unknown,
  keywords: string[],
  maxHits: number,
): Digistore24Hit[] {
  const needles = keywords.map((item) => item.toLowerCase());
  const hits: Digistore24Hit[] = [];
  const seen = new Set<string>();
  const now = new Date();

  for (const entry of extractEntries(payload)) {
    const id = entryId(entry);
    if (!id || seen.has(id)) {
      continue;
    }
    const keyword = matchKeyword(entryHaystack(entry), needles);
    if (!keyword) {
      continue;
    }
    const niche = nicheForKeyword(keyword);
    if (!niche) {
      continue;
    }
    const url = entryUrl(entry, id);
    seen.add(id);
    hits.push({
      entryId: id,
      headline: entryHeadline(entry) || id,
      keyword,
      niche,
      url,
      domain: entryDomain(url),
      discoveredAt: now,
    });
    if (hits.length >= maxHits) {
      break;
    }
  }
  return hits;
}

async function defaultFetch(input: { url: string; apiKey: string }): Promise<unknown> {
  const response = await fetch(input.url, {
    method: "GET",
    headers: {
      "X-DS-API-KEY": input.apiKey,
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Digistore24 HTTP ${response.status}`);
  }
  return response.json();
}

export async function fetchDigistore24Hits(input: {
  keywords?: string[];
  maxHits: number;
  fetchFn?: Digistore24FetchFn;
}): Promise<{ hits: Digistore24Hit[] }> {
  const apiKey = process.env.DIGISTORE24_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("DIGISTORE24_API_KEY is missing");
  }

  const payload = await (input.fetchFn ?? defaultFetch)({
    url: DIGISTORE24_API_URL,
    apiKey,
  });

  return {
    hits: parseDigistore24Hits(
      payload,
      input.keywords ?? ALL_KEYWORDS,
      input.maxHits,
    ),
  };
}
