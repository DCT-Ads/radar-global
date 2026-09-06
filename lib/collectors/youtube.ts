import { ALL_KEYWORDS, nicheForKeyword } from "@/lib/niches";

export const YOUTUBE_SOURCE = "youtube";
export const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3/videos";
export const YOUTUBE_REGION = "BR";

export type YoutubeHit = {
  videoId: string;
  title: string;
  keyword: string;
  niche: string;
  url: string;
  channelTitle: string | null;
  publishedAt: Date;
};

export type YoutubeFetchFn = (input: {
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
  return null;
}

function videoId(item: RawEntry): string | null {
  return asString(item.id);
}

function snippetOf(item: RawEntry): RawEntry {
  return asRecord(item.snippet) ?? {};
}

function haystack(item: RawEntry): string {
  const snippet = snippetOf(item);
  return [
    asString(snippet.title),
    asString(snippet.description),
    asString(snippet.channelTitle),
    Array.isArray(snippet.tags)
      ? snippet.tags.filter((tag): tag is string => typeof tag === "string").join(" ")
      : null,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function matchKeyword(text: string, keywords: string[]): string | null {
  for (const keyword of keywords) {
    if (text.includes(keyword)) {
      return keyword;
    }
  }
  return null;
}

function publishedAtOf(snippet: RawEntry, fallback: Date): Date {
  const raw = asString(snippet.publishedAt);
  if (!raw) {
    return fallback;
  }
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? fallback : date;
}

function extractItems(payload: unknown): RawEntry[] {
  const root = asRecord(payload);
  if (!root) {
    throw new Error("YouTube response is not an object");
  }
  const error = asRecord(root.error);
  if (error) {
    throw new Error(asString(error.message) ?? "YouTube API error");
  }
  if (!Array.isArray(root.items)) {
    throw new Error("YouTube response has no items[]");
  }
  return root.items.filter((item): item is RawEntry => Boolean(asRecord(item)));
}

export function youtubeListUrl(apiKey: string, maxResults = 50): string {
  const params = new URLSearchParams({
    part: "snippet",
    chart: "mostPopular",
    regionCode: YOUTUBE_REGION,
    maxResults: String(Math.min(50, Math.max(1, maxResults))),
    key: apiKey,
  });
  return `${YOUTUBE_API_BASE}?${params.toString()}`;
}

export function parseYoutubeHits(
  payload: unknown,
  keywords: string[],
  maxHits: number,
): YoutubeHit[] {
  const needles = keywords.map((item) => item.toLowerCase());
  const hits: YoutubeHit[] = [];
  const seen = new Set<string>();
  const now = new Date();

  for (const item of extractItems(payload)) {
    const id = videoId(item);
    if (!id || seen.has(id)) {
      continue;
    }
    const keyword = matchKeyword(haystack(item), needles);
    if (!keyword) {
      continue;
    }
    const niche = nicheForKeyword(keyword);
    if (!niche) {
      continue;
    }
    const snippet = snippetOf(item);
    seen.add(id);
    hits.push({
      videoId: id,
      title: asString(snippet.title) || id,
      keyword,
      niche,
      url: `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`,
      channelTitle: asString(snippet.channelTitle),
      publishedAt: publishedAtOf(snippet, now),
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
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`YouTube HTTP ${response.status}`);
  }
  return response.json();
}

export async function fetchYoutubeHits(input: {
  keywords?: string[];
  maxHits: number;
  fetchFn?: YoutubeFetchFn;
}): Promise<{ hits: YoutubeHit[] }> {
  const apiKey = process.env.YOUTUBE_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("YOUTUBE_API_KEY is missing");
  }

  const payload = await (input.fetchFn ?? defaultFetch)({
    url: youtubeListUrl(apiKey),
    apiKey,
  });

  return {
    hits: parseYoutubeHits(payload, input.keywords ?? ALL_KEYWORDS, input.maxHits),
  };
}
