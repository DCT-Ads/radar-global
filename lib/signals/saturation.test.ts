import assert from "node:assert/strict";
import { getSaturationLevel } from "./saturation";

assert.equal(
  getSaturationLevel({
    keyword: null,
    keywordVolume: 1,
    medianVolume: 3,
    p75Volume: 8,
    confidence: 62,
    firstSeenDaysAgo: 0,
  }),
  null,
);

assert.equal(
  getSaturationLevel({
    keyword: "keto",
    keywordVolume: 2,
    medianVolume: 3,
    p75Volume: 8,
    confidence: 70,
    firstSeenDaysAgo: 1,
  }),
  "SAFE",
);

assert.equal(
  getSaturationLevel({
    keyword: "skincare",
    keywordVolume: 9,
    medianVolume: 3,
    p75Volume: 8,
    confidence: 70,
    firstSeenDaysAgo: 1,
  }),
  "SATURATED",
);

assert.equal(
  getSaturationLevel({
    keyword: "weightloss",
    keywordVolume: 4,
    medianVolume: 3,
    p75Volume: 8,
    confidence: 65,
    firstSeenDaysAgo: 20,
  }),
  "WARNING",
);

console.log("saturation levels ok");
