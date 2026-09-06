import assert from "node:assert/strict";
import {
  computeEarlySignal,
  evidenceDensitySi,
  freshnessSi,
  goldenWindowRank,
  sourceReliabilitySi,
  weightedAverage,
} from "@/lib/scoring/early-signal";
import { ADMIN_EARLY_SIGNAL_WEIGHTS } from "@/lib/scoring/admin-weights";

function almostEqual(actual: number, expected: number, eps = 1e-9) {
  assert.ok(Math.abs(actual - expected) < eps, `${actual} != ${expected}`);
}

function main() {
  almostEqual(freshnessSi(0), 1);
  assert.ok(freshnessSi(18) < 0.4);
  almostEqual(evidenceDensitySi(0), 0);
  almostEqual(evidenceDensitySi(3), 1);
  almostEqual(evidenceDensitySi(6), 1);
  assert.equal(sourceReliabilitySi([]), null);
  almostEqual(sourceReliabilitySi([80, 100]) ?? -1, 0.9);

  const empty = computeEarlySignal({
    firstSeenAt: new Date("2026-09-01T00:00:00Z"),
    evidences: [],
    signals: [],
  });
  assert.equal(empty.earlySignal, null);
  assert.equal(empty.dataQuality, null);
  assert.equal(empty.confidence, "LOW");

  const now = new Date("2026-09-06T00:00:00Z");
  const scored = computeEarlySignal({
    firstSeenAt: now,
    now,
    evidences: [
      {
        capturedAt: now,
        url: "https://example.com",
        type: "LANDING_PAGE",
        sourceSlug: "whoisds",
        sourceReliability: 85,
      },
    ],
    signals: [
      {
        source: "whoisds",
        rawData: { httpProbe: { landing: { live: false } } },
      },
    ],
  });

  assert.ok(scored.earlySignal != null);
  assert.ok((scored.earlySignal ?? 0) > 70);
  assert.equal(scored.factors.some((factor) => factor.key === "upcomingLanding"), true);
  assert.deepEqual(scored.weightsSnapshot, ADMIN_EARLY_SIGNAL_WEIGHTS);

  const liveWhois = computeEarlySignal({
    firstSeenAt: now,
    now,
    evidences: [
      {
        capturedAt: now,
        url: "https://example.com",
        type: "LANDING_PAGE",
        sourceSlug: "whoisds",
        sourceReliability: 85,
      },
    ],
    signals: [
      {
        source: "whoisds",
        rawData: { httpProbe: { landing: { live: true } } },
      },
    ],
  });
  const upcoming = scored.factors.find((factor) => factor.key === "upcomingLanding");
  const landed = liveWhois.factors.find((factor) => factor.key === "upcomingLanding");
  assert.equal(upcoming?.si, 1);
  assert.equal(landed?.si, 0);
  assert.ok((scored.earlySignal ?? 0) > (liveWhois.earlySignal ?? 0));

  const youtubeOnly = computeEarlySignal({
    firstSeenAt: now,
    now,
    evidences: [
      {
        capturedAt: now,
        url: "https://www.youtube.com/watch?v=abc",
        type: "YOUTUBE",
        sourceSlug: "youtube",
        sourceReliability: 80,
      },
    ],
    signals: [{ source: "youtube", rawData: { title: "Day Trading" } }],
  });
  assert.equal(
    youtubeOnly.factors.some((factor) => factor.key === "upcomingLanding"),
    false,
    "absent whoisds must not enter the sum",
  );

  const avg = weightedAverage([
    { key: "freshness", weight: 30, si: 1 },
    { key: "evidenceDensity", weight: 70, si: 0 },
  ]);
  almostEqual(avg ?? -1, 30);

  assert.ok(goldenWindowRank(80, "SAFE", 0) > goldenWindowRank(80, "SATURATED", 0));
  assert.ok(goldenWindowRank(80, "SAFE", 0) > goldenWindowRank(80, "SAFE", 40));
  assert.equal(goldenWindowRank(null, "SAFE", 0), Number.NEGATIVE_INFINITY);

  console.log("early-signal tests passed");
}

main();
