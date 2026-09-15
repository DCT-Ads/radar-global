import assert from "node:assert/strict";
import { interleaveBySource } from "./review-signals";

const mixed = interleaveBySource([
  [{ source: "whoisds", id: "w1" }, { source: "whoisds", id: "w2" }],
  [{ source: "muncheye", id: "m1" }, { source: "muncheye", id: "m2" }, { source: "muncheye", id: "m3" }],
]);

assert.deepEqual(
  mixed.map((row) => row.id),
  ["w1", "m1", "w2", "m2", "m3"],
);
assert.equal(mixed[0]?.source, "whoisds");
assert.equal(mixed[1]?.source, "muncheye");

console.log("review-signals interleave ok");
