import assert from "node:assert/strict";
import { prisma } from "@/lib/prisma";
import { upsertNrdSignal } from "@/lib/signals/persist-nrd";
import { trustedRegisteredAtFromRaw } from "@/lib/signals/whois-registered-at";

async function main() {
  const suffix = Date.now();
  const alphaDomain = `alpha-whois-${suffix}.example`;
  const betaDomain = `beta-whois-${suffix}.example`;
  const alphaWhois = new Date("2021-03-04T14:22:11.000Z");
  const betaWhois = new Date("2018-11-20T08:01:00.000Z");
  const listDate = "2026-09-09";
  const now = new Date("2026-09-12T21:05:00.000Z");

  const whoisByDomain: Record<string, Date> = {
    [alphaDomain]: alphaWhois,
    [betaDomain]: betaWhois,
  };

  const lookup = async (domain: string) => whoisByDomain[domain] ?? null;

  const alpha = await upsertNrdSignal(
    {
      domain: alphaDomain,
      keyword: "trading",
      niche: "finance",
      listDate,
      registeredAt: null,
    },
    { now, lookupRegisteredAt: lookup },
  );
  const beta = await upsertNrdSignal(
    {
      domain: betaDomain,
      keyword: "trading",
      niche: "finance",
      listDate,
      registeredAt: null,
    },
    { now, lookupRegisteredAt: lookup },
  );

  assert.equal(alpha.created, true);
  assert.equal(beta.created, true);
  const alphaStored = trustedRegisteredAtFromRaw(alpha.signal.rawData);
  const betaStored = trustedRegisteredAtFromRaw(beta.signal.rawData);
  assert.equal(alphaStored?.toISOString(), alphaWhois.toISOString());
  assert.equal(betaStored?.toISOString(), betaWhois.toISOString());
  assert.notEqual(alphaStored?.toISOString(), betaStored?.toISOString());
  assert.equal(alpha.signal.discoveredAt.toISOString(), now.toISOString());
  assert.equal(beta.signal.discoveredAt.toISOString(), now.toISOString());

  const reprobeNow = new Date("2026-09-12T23:00:00.000Z");
  const alphaAgain = await upsertNrdSignal(
    {
      domain: alphaDomain,
      keyword: "trading",
      niche: "finance",
      listDate: "2026-09-11",
      registeredAt: null,
    },
    {
      now: reprobeNow,
      lookupRegisteredAt: async () => new Date("1999-01-01T00:00:00.000Z"),
    },
  );

  assert.equal(alphaAgain.created, false);
  assert.equal(alphaAgain.signal.discoveredAt.toISOString(), now.toISOString());
  assert.equal(
    trustedRegisteredAtFromRaw(alphaAgain.signal.rawData)?.toISOString(),
    alphaWhois.toISOString(),
  );

  const emptyWhois = await upsertNrdSignal(
    {
      domain: `empty-whois-${suffix}.example`,
      keyword: "trading",
      niche: "finance",
      listDate,
      registeredAt: null,
    },
    { now, lookupRegisteredAt: async () => null },
  );
  assert.equal(trustedRegisteredAtFromRaw(emptyWhois.signal.rawData), null);

  const wipeDomain = `keep-enrich-${suffix}.example`;
  const kept = await upsertNrdSignal(
    {
      domain: wipeDomain,
      keyword: "trading",
      niche: "finance",
      listDate,
      registeredAt: null,
    },
    { now, lookupRegisteredAt: async () => null },
  );
  const wiped = await upsertNrdSignal(
    {
      domain: wipeDomain,
      keyword: "",
      niche: "",
      listDate,
      registeredAt: null,
    },
    { now, lookupRegisteredAt: async () => null },
  );
  assert.equal(wiped.created, false);
  assert.equal(wiped.signal.niche, "finance");
  assert.equal(wiped.signal.keyword, "trading");
  assert.ok((wiped.signal.confidence ?? 0) >= (kept.signal.confidence ?? 0));

  await prisma.signal.deleteMany({
    where: {
      value: { in: [alphaDomain, betaDomain, emptyWhois.signal.value, wipeDomain] },
    },
  });
  await prisma.$disconnect();
  console.log("persist-nrd date tests passed");
}

main().catch(async (error: unknown) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
