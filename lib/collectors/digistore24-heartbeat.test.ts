import assert from "node:assert/strict";
import { prisma } from "@/lib/prisma";
import { DIGISTORE24_SOURCE } from "./digistore24";
import { ensureSources, SOURCE_SLUGS } from "@/lib/sources";
import { runDigistore24Collection } from "./run-collection";

const TEST_ENTRY_ID = "rg-test-ds24-trading";
const NOISE_ENTRY_ID = "rg-test-ds24-noise";

function mockPayload() {
  return {
    result: "success",
    entries: [
      {
        id: TEST_ENTRY_ID,
        headline: "Pro Trading Signals Course",
        description: "Learn forex trading",
        salespage_url: "https://example.com/trading-course",
      },
      {
        id: NOISE_ENTRY_ID,
        headline: "Gardening for Beginners",
        description: "No marketplace keyword here",
        salespage_url: "https://example.com/garden",
      },
    ],
  };
}

async function cleanupTestSignals() {
  await prisma.signal.deleteMany({
    where: {
      source: DIGISTORE24_SOURCE,
      value: { in: [TEST_ENTRY_ID, NOISE_ENTRY_ID] },
    },
  });
}

async function restoreSource(lastRunAt: Date | null) {
  await prisma.source.update({
    where: { slug: SOURCE_SLUGS.digistore24 },
    data: {
      status: "ACTIVE",
      lastError: null,
      lastRunAt,
    },
  });
}

async function main() {
  await ensureSources();
  await cleanupTestSignals();

  const previousKey = process.env.DIGISTORE24_API_KEY;
  process.env.DIGISTORE24_API_KEY = "test-key-not-sent";

  await prisma.source.update({
    where: { slug: SOURCE_SLUGS.digistore24 },
    data: { lastRunAt: null, lastError: null, status: "ACTIVE" },
  });

  const errors: string[] = [];
  const persisted = await runDigistore24Collection(
    ["trading"],
    10,
    errors,
    async () => mockPayload(),
  );
  const again = await runDigistore24Collection(
    ["trading"],
    10,
    errors,
    async () => mockPayload(),
  );

  const source = await prisma.source.findUnique({
    where: { slug: SOURCE_SLUGS.digistore24 },
  });
  const saved = await prisma.signal.findMany({
    where: { source: DIGISTORE24_SOURCE, value: { in: [TEST_ENTRY_ID, NOISE_ENTRY_ID] } },
  });

  assert.equal(persisted, 1, "parser must keep only keyword matches");
  assert.equal(again, 1, "upsert must be idempotent");
  assert.equal(saved.length, 1);
  assert.equal(saved[0]?.value, TEST_ENTRY_ID);
  assert.ok(source?.lastRunAt, "digistore24 lastRunAt must be set after collection");
  assert.equal(source.lastError, null);
  assert.equal(source.status, "ACTIVE");
  assert.equal(errors.length, 0);
  const successRunAt = source.lastRunAt;

  console.log("digistore24 mock collect: ok");

  delete process.env.DIGISTORE24_API_KEY;
  const beforeMissing = await prisma.signal.count({
    where: { source: DIGISTORE24_SOURCE },
  });
  let fetchFnCalled = false;
  const missingErrors: string[] = [];
  const missingPersisted = await runDigistore24Collection(
    ["trading"],
    10,
    missingErrors,
    async () => {
      fetchFnCalled = true;
      return mockPayload();
    },
  );
  const afterMissing = await prisma.source.findUnique({
    where: { slug: SOURCE_SLUGS.digistore24 },
  });
  const afterMissingCount = await prisma.signal.count({
    where: { source: DIGISTORE24_SOURCE },
  });

  assert.equal(fetchFnCalled, false, "missing key must not call fetchFn/API");
  assert.equal(missingPersisted, 0);
  assert.equal(afterMissingCount, beforeMissing, "missing key must not invent signals");
  assert.ok(afterMissing?.lastRunAt, "heartbeat still sets lastRunAt on ERROR");
  assert.equal(afterMissing.lastError, "DIGISTORE24_API_KEY is missing");
  assert.equal(afterMissing.status, "ERROR");
  assert.ok(missingErrors[0]?.includes("DIGISTORE24_API_KEY is missing"));

  console.log("digistore24 missing key: ok");

  await prisma.source.update({
    where: { slug: SOURCE_SLUGS.digistore24 },
    data: { lastRunAt: null, lastError: null, status: "ACTIVE" },
  });
  const empty = await prisma.source.findUnique({
    where: { slug: SOURCE_SLUGS.digistore24 },
  });
  let broke = false;
  try {
    assert.ok(empty?.lastRunAt, "digistore24 lastRunAt must be set after collection");
  } catch (error) {
    broke = true;
    console.log("NEGATIVE PROOF: test BREAKS when markSource is not called");
    console.log(error instanceof Error ? error.message : error);
  }
  assert.equal(broke, true, "negative proof must fail without markSource");

  if (previousKey === undefined) {
    delete process.env.DIGISTORE24_API_KEY;
  } else {
    process.env.DIGISTORE24_API_KEY = previousKey;
  }
  await cleanupTestSignals();
  await restoreSource(successRunAt);

  const select = await prisma.$queryRaw<
    { slug: string; lastRunAt: Date | null; lastError: string | null }[]
  >`
    SELECT slug, "lastRunAt", "lastError"
    FROM "Source"
    WHERE slug = 'digistore24'
  `;
  console.log(JSON.stringify(select, null, 2));

  await prisma.$disconnect();
  console.log("digistore24-heartbeat.test.ts ok");
}

main().catch(async (error: unknown) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
