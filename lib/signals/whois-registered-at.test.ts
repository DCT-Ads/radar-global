import assert from "node:assert/strict";
import {
  effectiveDiscoveredAt,
  parseRegisteredAtFromRdap,
  parseRegisteredAtFromWhois,
  resolveSignalTimelineDates,
} from "./whois-registered-at";

function main() {
  const whoisAlpha = `
Domain Name: ALPHA-COURSE.COM
Creation Date: 2021-03-04T14:22:11Z
Registrar: Example
`.trim();
  const whoisBeta = `
domain: BETA-LAUNCH.NET
Registered On: 2018-11-20
created: 2018-11-20T08:01:00Z
`.trim();

  const alpha = parseRegisteredAtFromWhois(whoisAlpha);
  const beta = parseRegisteredAtFromWhois(whoisBeta);
  assert.ok(alpha, "WHOIS Creation Date must parse");
  assert.ok(beta, "WHOIS Registered On must parse");
  assert.notEqual(alpha.getTime(), beta.getTime());
  assert.equal(alpha.toISOString().slice(0, 10), "2021-03-04");
  assert.equal(beta.toISOString().slice(0, 10), "2018-11-20");

  const missing = parseRegisteredAtFromWhois("Domain Name: none.example\nUpdated Date: 2026-01-01");
  assert.equal(missing, null);

  const rdapAlpha = parseRegisteredAtFromRdap({
    events: [{ eventAction: "registration", eventDate: "2021-03-04T14:22:11Z" }],
  });
  const rdapBeta = parseRegisteredAtFromRdap({
    events: [{ eventAction: "registered", eventDate: "2018-11-20T08:01:00Z" }],
  });
  assert.ok(rdapAlpha && rdapBeta);
  assert.notEqual(rdapAlpha.getTime(), rdapBeta.getTime());

  const now = new Date("2026-09-12T21:00:00.000Z");
  const first = resolveSignalTimelineDates({
    whoisRegisteredAt: alpha,
    listDate: "2026-09-09",
    now,
  });
  const reprobe = resolveSignalTimelineDates({
    existingDiscoveredAt: first.discoveredAt,
    existingRegisteredAt: first.registeredAt,
    whoisRegisteredAt: beta,
    listDate: "2026-09-11",
    now: new Date("2026-09-12T22:00:00.000Z"),
  });
  assert.equal(reprobe.discoveredAt.toISOString(), first.discoveredAt.toISOString());
  assert.equal(reprobe.registeredAt?.toISOString(), first.registeredAt?.toISOString());

  const listStamp = resolveSignalTimelineDates({
    existingRegisteredAt: new Date("2026-09-09T00:00:00.000Z"),
    whoisRegisteredAt: null,
    listDate: "2026-09-09",
    now,
  });
  assert.equal(listStamp.registeredAt, null);

  const written = [
    { domain: "alpha.com", registeredAt: alpha.toISOString() },
    { domain: "beta.com", registeredAt: beta.toISOString() },
  ];
  assert.notEqual(written[0]?.registeredAt, written[1]?.registeredAt);

  const createdAt = new Date("2026-09-12T18:44:03.123Z");
  const precise = new Date("2026-09-12T21:05:00.000Z");
  assert.equal(
    effectiveDiscoveredAt({
      discoveredAt: new Date("2026-09-09T00:00:00.000Z"),
      createdAt,
    }).toISOString(),
    createdAt.toISOString(),
  );
  assert.equal(
    effectiveDiscoveredAt({ discoveredAt: precise, createdAt }).toISOString(),
    precise.toISOString(),
  );

  console.log("whois-registered-at tests passed");
}

main();
