import { ALL_KEYWORDS, matchesKeywordWord, nicheForKeyword } from "@/lib/niches";
import {
  addDropStats,
  emptyDropStats,
  type CollectorDropStats,
} from "./drop-stats";

export const YOUTUBE_SOURCE = "youtube";
export const YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";
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
  keyword: string;
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
  const direct = asString(item.id);
  if (direct) {
    return direct;
  }
  const nested = asRecord(item.id);
  return nested ? asString(nested.videoId) : null;
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
    if (matchesKeywordWord(text, keyword)) {
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

export function youtubeSearchUrl(apiKey: string, keyword: string, maxResults = 25): string {
  const params = new URLSearchParams({
    part: "snippet",
    q: keyword,
    type: "video",
    order: "date",
    maxResults: String(Math.min(50, Math.max(1, maxResults))),
    key: apiKey,
  });
  return `${YOUTUBE_SEARCH_URL}?${params.toString()}`;
}

export function parseYoutubeHits(
  payload: unknown,
  keywords: string[],
  maxHits: number,
  queryKeyword?: string,
): { hits: YoutubeHit[]; stats: CollectorDropStats } {
  const needles = keywords.map((item) => item.toLowerCase());
  const hits: YoutubeHit[] = [];
  const seen = new Set<string>();
  const now = new Date();
  const stats = emptyDropStats();
  const items = extractItems(payload);
  stats.fetched = items.length;

  for (const item of items) {
    const id = videoId(item);
    if (!id || seen.has(id)) {
      continue;
    }
    const fromQuery = queryKeyword?.trim().toLowerCase();
    const text = haystack(item);
    const keyword =
      fromQuery && matchesKeywordWord(text, fromQuery)
        ? fromQuery
        : matchKeyword(text, needles);
    if (!keyword) {
      stats.keywordMiss += 1;
      continue;
    }
    const niche = nicheForKeyword(keyword);
    if (!niche) {
      stats.noNiche += 1;
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
  stats.kept = hits.length;
  return { hits, stats };
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
}): Promise<{ hits: YoutubeHit[]; stats: CollectorDropStats }> {
  const apiKey = process.env.YOUTUBE_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("YOUTUBE_API_KEY is missing");
  }

  const keywords = input.keywords ?? ALL_KEYWORDS;
  const hits: YoutubeHit[] = [];
  const seen = new Set<string>();
  const stats = emptyDropStats();
  const fetchFn = input.fetchFn ?? defaultFetch;

  for (const keyword of keywords) {
    if (hits.length >= input.maxHits) {
      break;
    }
    const payload = await fetchFn({
      url: youtubeSearchUrl(apiKey, keyword, input.maxHits),
      apiKey,
      keyword,
    });
    const parsed = parseYoutubeHits(
      payload,
      [keyword],
      input.maxHits - hits.length,
      keyword,
    );
    addDropStats(stats, parsed.stats);
    for (const hit of parsed.hits) {
      if (seen.has(hit.videoId)) {
        continue;
      }
      seen.add(hit.videoId);
      hits.push(hit);
    }
  }

  stats.kept = hits.length;
  return { hits, stats };
}
