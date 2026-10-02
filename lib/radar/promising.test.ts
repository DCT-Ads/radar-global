import assert from "node:assert/strict";
import {
  acceleratingPair,
  accelerationRatio,
  isPromisingGarimpo,
  PROMISING_ACCELERATION_MIN,
  signalCountSeries,
} from "@/lib/radar/promising";

function day(iso: string) {
  return new Date(`${iso}T12:00:00.000Z`);
}

function main() {
  const series = signalCountSeries([
    day("2026-10-01"),
    day("2026-10-01"),
    day("2026-10-02"),
    day("2026-10-02"),
    day("2026-10-02"),
    day("2026-10-02"),
    day("2026-10-02"),
    day("2026-10-02"),
    day("2026-10-02"),
    day("2026-10-02"),
  ]);
  assert.deepEqual(series.map((point) => point.count), [2, 8]);
  assert.equal(accelerationRatio(series), 3);
  assert.equal(PROMISING_ACCELERATION_MIN, 3);

  const now = day("2026-10-07");
  const hit = isPromisingGarimpo({
    firstSeenAt: day("2026-10-02"),
    saturation: "SAFE",
    signalDates: [day("2026-10-01"), day("2026-10-02"), day("2026-10-02"), day("2026-10-02"), day("2026-10-02")],
    now,
  });
  assert.equal(hit, true);

  assert.equal(
    isPromisingGarimpo({
      firstSeenAt: day("2026-10-06"),
      saturation: "SAFE",
      signalDates: [day("2026-10-01"), day("2026-10-02"), day("2026-10-02"), day("2026-10-02"), day("2026-10-02")],
      now,
    }),
    false,
  );
  assert.equal(
    isPromisingGarimpo({
      firstSeenAt: day("2026-10-02"),
      saturation: "WARNING",
      signalDates: [day("2026-10-01"), day("2026-10-02"), day("2026-10-02"), day("2026-10-02"), day("2026-10-02")],
      now,
    }),
    false,
  );
  assert.equal(acceleratingPair([day("2026-10-01")]) , null);
  const pair = acceleratingPair([
    day("2026-10-01"),
    day("2026-10-02"),
    day("2026-10-02"),
    day("2026-10-02"),
    day("2026-10-02"),
  ]);
  assert.equal(pair?.previousDay, "2026-10-01");
  assert.equal(pair?.latestDay, "2026-10-02");

  console.log("promising garimpo ok");
}

main();
