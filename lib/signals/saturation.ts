import { ageInDays } from "@/lib/collectors/domains";
import { NRD_SOURCE } from "@/lib/collectors/nrd";
import { prisma } from "@/lib/prisma";

export type SaturationLevel = "SAFE" | "WARNING" | "SATURATED";

export type SaturationInputs = {
  keyword?: string | null;
  keywordVolume: number;
  medianVolume: number;
  p75Volume: number;
  confidence: number;
  firstSeenDaysAgo: number;
};

export function asJsonRecord(
  value: unknown,
): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

/** Azul: só WhoisDS e a home ainda não foi vista no ar (probe ausente ou live=false). */
export function isUpcomingLaunch(input: {
  source: string;
  landingLive?: boolean | null;
}): boolean {
  return input.source === NRD_SOURCE && input.landingLive !== true;
}

export const isUpcomingSignal = isUpcomingLaunch;

export function dateFromRawField(raw: Record<string, unknown> | null, key: string): Date | null {
  const value = raw?.[key];
  if (typeof value === "string" && !Number.isNaN(Date.parse(value))) {
    return new Date(value);
  }
  return null;
}

export function registeredAtFromRaw(rawData: unknown): Date | null {
  const raw = asJsonRecord(rawData);
  const date =
    dateFromRawField(raw, "registeredAt") ?? dateFromRawField(raw, "registered_at");
  if (!date) {
    return null;
  }
  const listDate = typeof raw?.listDate === "string" ? raw.listDate : null;
  if (
    listDate &&
    date.getUTCHours() === 0 &&
    date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0 &&
    date.toISOString().slice(0, 10) === listDate
  ) {
    return null;
  }
  return date;
}

export function launchAtFromRaw(rawData: unknown): Date | null {
  return dateFromRawField(asJsonRecord(rawData), "launchAt");
}

export function landingLiveFromRaw(rawData: unknown): boolean | null {
  const raw = asJsonRecord(rawData);
  const probe = asJsonRecord(raw?.httpProbe);
  const landing = asJsonRecord(probe?.landing);
  if (typeof landing?.live === "boolean") {
    return landing.live;
  }
  return null;
}

export function volumePercentiles(volumes: number[]): {
  median: number;
  p75: number;
} {
  const sorted = volumes.filter((value) => value > 0).sort((a, b) => a - b);
  if (sorted.length === 0) {
    return { median: 0, p75: 0 };
  }
  const at = (p: number) =>
    sorted[Math.min(sorted.length - 1, Math.floor(p * (sorted.length - 1)))] ?? 0;
  return { median: at(0.5), p75: at(0.75) };
}

export function indexKeywordVolumes(
  rows: Array<{ keyword: string | null; _count: { _all: number } }>,
) {
  const byKeyword = Object.fromEntries(
    rows
      .filter((row) => row.keyword)
      .map((row) => [row.keyword as string, row._count._all]),
  );
  return { byKeyword, ...volumePercentiles(Object.values(byKeyword)) };
}

export function getSaturationLevel(signal: SaturationInputs): SaturationLevel | null {
  if (!signal.keyword?.trim()) {
    return null;
  }

  const competitors = Math.max(0, signal.keywordVolume);
  const age = Math.max(0, signal.firstSeenDaysAgo);
  const median = signal.medianVolume;
  const p75 = signal.p75Volume;
  const spread = p75 > median && p75 > 1;

  if ((spread && competitors >= p75) || competitors >= 15 || age >= 45) {
    return "SATURATED";
  }
  if ((spread && competitors > median) || competitors >= 6 || age >= 14) {
    return "WARNING";
  }
  if (competitors >= 1 && age < 14) {
    return "SAFE";
  }
  return null;
}

export async function saturationInputsForSignal(signal: {
  id: string;
  keyword: string | null;
  niche: string | null;
  confidence: number;
  discoveredAt: Date;
}): Promise<SaturationInputs> {
  const grouped = await prisma.signal.groupBy({
    by: ["keyword"],
    _count: { _all: true },
  });
  const { byKeyword, median, p75 } = indexKeywordVolumes(grouped);
  const keywordVolume = signal.keyword
    ? (byKeyword[signal.keyword] ?? 1)
    : 0;

  return {
    keyword: signal.keyword,
    keywordVolume,
    medianVolume: median,
    p75Volume: p75,
    confidence: signal.confidence,
    firstSeenDaysAgo: ageInDays(signal.discoveredAt),
  };
}
