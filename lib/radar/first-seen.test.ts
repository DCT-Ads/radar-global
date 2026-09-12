import assert from "node:assert/strict";
import {
  firstSeenAtFromLaunch,
  firstSeenAtFromSignal,
  uniqueEvidenceCount,
} from "./first-seen";

function main() {
  const midnight = new Date("2026-09-10T00:00:00.000Z");
  const issued = new Date("2026-09-02T19:20:00.000Z");
  const launchAt = new Date("2026-09-11T06:37:09.701Z");

  assert.equal(
    firstSeenAtFromSignal({
      discoveredAt: issued,
      rawData: { issuedAt: issued.toISOString() },
    }).toISOString(),
    issued.toISOString(),
  );

  assert.equal(
    firstSeenAtFromSignal({
      discoveredAt: midnight,
      rawData: { registeredAt: midnight.toISOString(), launchAt: launchAt.toISOString() },
    }).toISOString(),
    launchAt.toISOString(),
  );

  assert.equal(
    firstSeenAtFromLaunch({
      firstSeenAt: midnight,
      signals: [
        {
          discoveredAt: midnight,
          rawData: { launchAt: launchAt.toISOString() },
        },
      ],
    }).toISOString(),
    launchAt.toISOString(),
  );

  assert.equal(
    uniqueEvidenceCount([{ id: "a" }, { id: "b" }], [{ id: "b" }, { id: "c" }]),
    3,
  );

  console.log("first-seen tests passed");
}

main();
