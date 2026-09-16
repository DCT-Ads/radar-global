import assert from "node:assert/strict";
import { prisma } from "@/lib/prisma";
import { ensureSources, SOURCE_SLUGS } from "@/lib/sources";
import { runNrdCollection } from "./run-collection";

async function main() {
  await ensureSources();
  await prisma.source.update({
    where: { slug: SOURCE_SLUGS.nrd },
    data: { lastRunAt: null, lastError: null, status: "ACTIVE" },
  });

  const errors: string[] = [];
  const persisted = await runNrdCollection(["trading"], 1, errors, async () => ({
    hits: [],
    listDate: "2026-09-04",
  }));

  const source = await prisma.source.findUnique({
    where: { slug: SOURCE_SLUGS.nrd },
  });

  assert.equal(persisted, 0);
  assert.ok(source?.lastRunAt, "whoisds lastRunAt must be set after collection");
  assert.equal(source.lastError, "whoisds fetched=0 keywordMiss=0 noNiche=0 tooOld=0 apexMiss=0 kept=0");
  assert.equal(source.status, "ACTIVE");
  assert.equal(errors.length, 0);

  await prisma.source.update({
    where: { slug: SOURCE_SLUGS.nrd },
    data: { lastRunAt: null, lastError: null },
  });

  const failed = await runNrdCollection(["trading"], 1, errors, async () => {
    throw new Error("WhoisDS unavailable");
  });
  const afterFail = await prisma.source.findUnique({
    where: { slug: SOURCE_SLUGS.nrd },
  });

  assert.equal(failed, 0);
  assert.ok(afterFail?.lastRunAt, "whoisds lastRunAt must be set even on failure");
  assert.equal(afterFail.lastError, "WhoisDS unavailable");
  assert.equal(afterFail.status, "ERROR");

  const latest = await prisma.signal.aggregate({
    where: { source: "whoisds" },
    _max: { createdAt: true },
  });
  await prisma.source.update({
    where: { slug: SOURCE_SLUGS.nrd },
    data: {
      status: "ACTIVE",
      lastError: null,
      lastRunAt: latest._max.createdAt,
    },
  });

  await prisma.$disconnect();
  console.log("nrd-heartbeat.test.ts ok");
}

main().catch(async (error: unknown) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
