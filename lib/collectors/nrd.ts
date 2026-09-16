import { inflateRawSync, gunzipSync } from "node:zlib";
import { ALL_KEYWORDS, nicheForKeyword } from "@/lib/niches";
import { cleanHost, domainIncludesKeyword } from "./domains";
import { emptyDropStats, type CollectorDropStats } from "./drop-stats";

export const NRD_SOURCE = "whoisds";

export type NrdHit = {
  domain: string;
  keyword: string;
  niche: string;
  listDate: string;
  /** WHOIS/RDAP Creation Date only. Never the WhoisDS list day. */
  registeredAt?: Date | null;
};

function utcDate(daysAgo: number): Date {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date;
}

function ymd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function whoisdsUrls(listDate: string): string[] {
  const name = `${listDate}.zip`;
  const standard = Buffer.from(name).toString("base64");
  const echoStyle = Buffer.from(`${name}\n`).toString("base64").slice(0, -1);
  return [
    `https://whoisds.com/whois-database/newly-registered-domains/${standard}/nrd`,
    `https://whoisds.com/whois-database/newly-registered-domains/${echoStyle}/nrd`,
  ];
}

function extractArchiveText(buffer: Buffer): string {
  if (buffer.length >= 2 && buffer[0] === 0x1f && buffer[1] === 0x8b) {
    return gunzipSync(buffer).toString("utf8");
  }
  if (buffer.length >= 4 && buffer.readUInt32LE(0) === 0x04034b50) {
    const method = buffer.readUInt16LE(8);
    const compSize = buffer.readUInt32LE(18);
    const nameLen = buffer.readUInt16LE(26);
    const extraLen = buffer.readUInt16LE(28);
    const dataStart = 30 + nameLen + extraLen;
    const compressed = buffer.subarray(dataStart, dataStart + compSize);
    if (method === 0) {
      return compressed.toString("utf8");
    }
    if (method === 8) {
      return inflateRawSync(compressed).toString("utf8");
    }
    throw new Error(`Unsupported zip method ${method}`);
  }
  const asText = buffer.toString("utf8");
  if (asText.includes(".") && asText.split("\n").length > 10) {
    return asText;
  }
  throw new Error("WhoisDS response is not a domain list");
}

async function downloadWhoisdsList(listDate: string): Promise<string> {
  let lastError: Error | null = null;
  for (const url of whoisdsUrls(listDate)) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "RadarGlobalBot/1.0 (newly-registered-domains collector)",
          Accept: "application/zip,application/gzip,text/plain,*/*",
        },
        cache: "no-store",
        redirect: "follow",
      });
      if (!response.ok) {
        lastError = new Error(`WhoisDS ${listDate} HTTP ${response.status}`);
        continue;
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.length < 64) {
        lastError = new Error(`WhoisDS ${listDate} empty payload`);
        continue;
      }
      return extractArchiveText(buffer);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("WhoisDS fetch failed");
    }
  }
  throw lastError ?? new Error(`WhoisDS ${listDate} unavailable`);
}

function matchKeyword(domain: string, keywords: string[]): string | null {
  for (const keyword of keywords) {
    if (domainIncludesKeyword(domain, keyword)) {
      return keyword;
    }
  }
  return null;
}

export async function fetchNrdHits(input: {
  keywords?: string[];
  maxHits: number;
  lookbackDays?: number;
}): Promise<{ hits: NrdHit[]; listDate: string; stats: CollectorDropStats }> {
  const keywords = (input.keywords ?? ALL_KEYWORDS).map((item) => item.toLowerCase());
  const lookback = input.lookbackDays ?? 3;
  let lastError: Error | null = null;

  for (let daysAgo = 1; daysAgo <= lookback; daysAgo += 1) {
    const listDay = utcDate(daysAgo);
    const listDate = ymd(listDay);
    try {
      const text = await downloadWhoisdsList(listDate);
      const hits: NrdHit[] = [];
      const seen = new Set<string>();
      const stats = emptyDropStats();
      const lines = text.split(/\r?\n/);
      stats.fetched = lines.filter((line) => line.trim()).length;
      for (const line of lines) {
        const host = cleanHost(line);
        if (!host || seen.has(host)) {
          continue;
        }
        const keyword = matchKeyword(host, keywords);
        if (!keyword) {
          stats.keywordMiss += 1;
          continue;
        }
        const niche = nicheForKeyword(keyword);
        if (!niche) {
          stats.noNiche += 1;
          continue;
        }
        seen.add(host);
        hits.push({
          domain: host,
          keyword,
          niche,
          listDate,
          registeredAt: null,
        });
        if (hits.length >= input.maxHits) {
          break;
        }
      }
      stats.kept = hits.length;
      return { hits, listDate, stats };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("WhoisDS failed");
    }
  }

  throw lastError ?? new Error("WhoisDS list unavailable");
}
