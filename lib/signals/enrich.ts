import { ageInDays } from "@/lib/collectors/domains";
import { inferGeo } from "@/lib/signals/geo-from-domain";
import { landingLiveFromRaw } from "@/lib/signals/saturation";

export type EnrichmentInput = {
  domain: string;
  keyword?: string | null;
  discoveredAt: Date;
  source?: string | null;
  sourceReliability?: number;
  evidenceCount?: number;
  landingLive?: boolean;
  keywordVolume?: number;
  maxKeywordVolume?: number;
  pageLocale?: string | null;
};

export type EnrichmentResult = {
  confidence: number;
  countryHint: string | null;
  langHint: string | null;
};

const PROBED_SOURCES = new Set(["whoisds", "crt.sh", "muncheye"]);

/** Soma = 100. Cada fator entra como 0–1 × peso. */
export const CONFIDENCE_WEIGHTS = {
  age: 30,
  sourceReliability: 25,
  keywordVolume: 20,
  landingLive: 15,
  evidenceCount: 10,
} as const;

const SOURCE_RELIABILITY: Record<string, number> = {
  "crt.sh": 95,
  crtsh: 95,
  http_probe: 90,
  whoisds: 85,
  digistore24: 80,
  youtube: 80,
  muncheye: 70,
};

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function ageFactor(days: number) {
  return Math.exp(-Math.max(0, days) / 18);
}

function sourceReliabilityFactor(
  source: string | null | undefined,
  reliability: number | undefined,
) {
  const rel = reliability ?? SOURCE_RELIABILITY[source ?? ""] ?? 50;
  return clamp01(rel / 100);
}

function keywordVolumeFactor(volume: number, maxVolume: number) {
  const observed = Math.max(volume, 1);
  const max = Math.max(maxVolume, observed, 10);
  return clamp01(1 - Math.log10(observed + 1) / Math.log10(max + 1));
}

function landingLiveFactor(landingLive: boolean) {
  return landingLive ? 1 : 0;
}

function evidenceCountFactor(evidenceCount: number) {
  return clamp01(evidenceCount / 2);
}

export function enrichmentIsIncomplete(input: {
  keyword?: string | null;
  landingLive?: boolean;
  evidenceCount?: number;
}) {
  const hasKeyword = Boolean(input.keyword?.trim());
  const probed = typeof input.landingLive === "boolean";
  const hasEvidence = (input.evidenceCount ?? 0) > 0;
  return !hasKeyword || (!probed && !hasEvidence);
}

export function isStoredSignalIncomplete(signal: {
  source: string;
  keyword: string | null;
  rawData: unknown;
}) {
  if (!signal.keyword?.trim()) {
    return true;
  }
  if (
    PROBED_SOURCES.has(signal.source) &&
    landingLiveFromRaw(signal.rawData) === null
  ) {
    return true;
  }
  return false;
}

export function enrichSignal(input: EnrichmentInput): EnrichmentResult {
  const geo = inferGeo({
    domain: input.domain,
    keyword: input.keyword,
    pageLocale: input.pageLocale,
  });
  const days = Math.max(0, ageInDays(input.discoveredAt));
  const hasKeyword = Boolean(input.keyword?.trim());
  const volume = Math.max(1, input.keywordVolume ?? 1);
  const maxVolume = input.maxKeywordVolume ?? volume;

  const confidence =
    CONFIDENCE_WEIGHTS.age * ageFactor(days) +
    CONFIDENCE_WEIGHTS.sourceReliability *
      sourceReliabilityFactor(input.source, input.sourceReliability) +
    (hasKeyword
      ? CONFIDENCE_WEIGHTS.keywordVolume * keywordVolumeFactor(volume, maxVolume)
      : 0) +
    (typeof input.landingLive === "boolean"
      ? CONFIDENCE_WEIGHTS.landingLive * landingLiveFactor(input.landingLive)
      : 0) +
    CONFIDENCE_WEIGHTS.evidenceCount * evidenceCountFactor(input.evidenceCount ?? 0);

  return {
    confidence: Math.round(Math.min(100, Math.max(0, confidence))),
    countryHint: geo.countryHint,
    langHint: geo.langHint,
  };
}
