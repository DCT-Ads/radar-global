import assert from "node:assert/strict";
import {
  enrichSignal,
  enrichmentIsIncomplete,
  isStoredSignalIncomplete,
} from "./enrich";

const now = new Date();

const incompleteNoKeyword = enrichSignal({
  domain: "example.com",
  keyword: null,
  discoveredAt: now,
  source: "muncheye",
});
const withKeyword = enrichSignal({
  domain: "ketoexample.com",
  keyword: "keto",
  discoveredAt: now,
  source: "whoisds",
  keywordVolume: 2,
  maxKeywordVolume: 9,
  landingLive: true,
  evidenceCount: 2,
});

assert.equal(enrichmentIsIncomplete({ keyword: null, evidenceCount: 0 }), true);
assert.equal(
  enrichmentIsIncomplete({ keyword: "keto", landingLive: true }),
  false,
);
assert.notEqual(incompleteNoKeyword.confidence, withKeyword.confidence);
assert.ok(withKeyword.confidence > incompleteNoKeyword.confidence);
assert.equal(
  isStoredSignalIncomplete({
    source: "muncheye",
    keyword: null,
    rawData: null,
  }),
  true,
);
assert.equal(
  isStoredSignalIncomplete({
    source: "whoisds",
    keyword: "skincare",
    rawData: { httpProbe: { landing: { live: false } } },
  }),
  false,
);

console.log("enrich incomplete/variation ok", {
  incomplete: incompleteNoKeyword.confidence,
  probed: withKeyword.confidence,
});
