import type { Confidence, EvidenceType } from "@prisma/client";
import { ageInDays } from "@/lib/collectors/domains";
import { NRD_SOURCE } from "@/lib/collectors/nrd";
import {
  isUpcomingLaunch,
  landingLiveFromRaw,
  type SaturationLevel,
} from "@/lib/signals/saturation";
import {
  ADMIN_EARLY_SIGNAL_WEIGHTS,
  getEarlySignalWeights,
  type EarlySignalWeightKey,
} from "@/lib/scoring/admin-weights";

export type ObservedFactor = {
  key: EarlySignalWeightKey;
  weight: number;
  si: number;
};

export type EarlySignalInput = {
  firstSeenAt: Date | null;
  evidences: Array<{
    capturedAt: Date;
    url: string;
    type: EvidenceType;
    sourceSlug?: string | null;
    sourceReliability?: number | null;
  }>;
  signals: Array<{
    source: string;
    rawData: unknown;
  }>;
  now?: Date;
};

export type EarlySignalResult = {
  earlySignal: number | null;
  dataQuality: number | null;
  confidence: Confidence;
  factors: ObservedFactor[];
  weightsSnapshot: Record<EarlySignalWeightKey, number>;
};

const FRESHNESS_HALF_LIFE_DAYS = 18;
const GOLDEN_WINDOW_HALF_LIFE_DAYS = 21;

export function freshnessSi(days: number) {
  return Math.exp(-Math.max(0, days) / FRESHNESS_HALF_LIFE_DAYS);
}

export function evidenceDensitySi(count: number) {
  return Math.min(1, Math.max(0, count / 3));
}

export function sourceReliabilitySi(reliabilities: number[]) {
  if (reliabilities.length === 0) {
    return null;
  }
  const avg =
    reliabilities.reduce((sum, value) => sum + value, 0) / reliabilities.length;
  return Math.min(1, Math.max(0, avg / 100));
}

export function weightedAverage(factors: ObservedFactor[]) {
  const denom = factors.reduce((sum, factor) => sum + factor.weight, 0);
  if (denom <= 0) {
    return null;
  }
  const numer = factors.reduce((sum, factor) => sum + factor.weight * factor.si, 0);
  return (100 * numer) / denom;
}

export function goldenWindowRank(
  earlySignal: number | null,
  saturation: SaturationLevel | null,
  firstSeenDaysAgo: number,
) {
  if (earlySignal == null) {
    return Number.NEGATIVE_INFINITY;
  }
  const satMul =
    saturation === "SATURATED"
      ? 0.25
      : saturation === "WARNING"
        ? 0.6
        : saturation === "SAFE"
          ? 1
          : 0.5;
  const recency = Math.exp(
    -Math.max(0, firstSeenDaysAgo) / GOLDEN_WINDOW_HALF_LIFE_DAYS,
  );
  return earlySignal * satMul * recency;
}

function confidenceFromEvidence(input: {
  evidenceCount: number;
  sourceCount: number;
  reliability: number | null;
}): Confidence {
  if (input.evidenceCount >= 3 || input.sourceCount >= 2) {
    return "HIGH";
  }
  if (input.evidenceCount >= 2 || (input.reliability ?? 0) >= 80) {
    return "MED";
  }
  return "LOW";
}

function dataQualityFromEvidence(input: {
  evidenceCount: number;
  hasUrl: boolean;
  freshness: number | null;
}) {
  if (input.evidenceCount === 0) {
    return null;
  }
  const recency = input.freshness ?? 0;
  return Math.round(
    100 *
      ((input.hasUrl ? 0.3 : 0) +
        0.4 * recency +
        0.3 * evidenceDensitySi(input.evidenceCount)),
  );
}

export function computeEarlySignal(input: EarlySignalInput): EarlySignalResult {
  const weights = getEarlySignalWeights();
  const now = input.now ?? new Date();
  const factors: ObservedFactor[] = [];

  if (input.evidences.length === 0) {
    return {
      earlySignal: null,
      dataQuality: null,
      confidence: "LOW",
      factors,
      weightsSnapshot: weights,
    };
  }

  const firstSeen = input.firstSeenAt ?? input.evidences[0]?.capturedAt ?? null;
  if (firstSeen) {
    factors.push({
      key: "freshness",
      weight: weights.freshness,
      si: freshnessSi(ageInDays(firstSeen, now)),
    });
  }

  factors.push({
    key: "evidenceDensity",
    weight: weights.evidenceDensity,
    si: evidenceDensitySi(input.evidences.length),
  });

  const whoisSignals = input.signals.filter((signal) => signal.source === NRD_SOURCE);
  if (whoisSignals.length > 0) {
    const upcoming = whoisSignals.some((signal) =>
      isUpcomingLaunch({
        source: signal.source,
        landingLive: landingLiveFromRaw(signal.rawData),
      }),
    );
    factors.push({
      key: "upcomingLanding",
      weight: weights.upcomingLanding,
      si: upcoming ? 1 : 0,
    });
  }

  const reliabilities = input.evidences
    .map((evidence) => evidence.sourceReliability)
    .filter((value): value is number => typeof value === "number");
  const reliabilitySi = sourceReliabilitySi(reliabilities);
  if (reliabilitySi != null) {
    factors.push({
      key: "sourceReliability",
      weight: weights.sourceReliability,
      si: reliabilitySi,
    });
  }

  const early = weightedAverage(factors);
  const freshness = factors.find((factor) => factor.key === "freshness")?.si ?? null;
  const sourceSlugs = new Set(
    input.evidences
      .map((evidence) => evidence.sourceSlug)
      .filter((value): value is string => Boolean(value)),
  );

  return {
    earlySignal: early == null ? null : Math.round(Math.min(100, Math.max(0, early))),
    dataQuality: dataQualityFromEvidence({
      evidenceCount: input.evidences.length,
      hasUrl: input.evidences.some((evidence) => Boolean(evidence.url)),
      freshness,
    }),
    confidence: confidenceFromEvidence({
      evidenceCount: input.evidences.length,
      sourceCount: sourceSlugs.size,
      reliability:
        reliabilities.length === 0
          ? null
          : reliabilities.reduce((sum, value) => sum + value, 0) / reliabilities.length,
    }),
    factors,
    weightsSnapshot: weights,
  };
}

export { ADMIN_EARLY_SIGNAL_WEIGHTS };
