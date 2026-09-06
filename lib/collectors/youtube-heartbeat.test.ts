import assert from "node:assert/strict";
import { prisma } from "@/lib/prisma";
import { YOUTUBE_SOURCE } from "./youtube";
import { ensureSources, SOURCE_SLUGS } from "@/lib/sources";
import { runYoutubeCollection } from "./run-collection";

const TEST_VIDEO_ID = "rgtestyttrading1";
const NOISE_VIDEO_ID = "rgtestytnoise000";

function mockPayload() {
  return {
    kind: "youtube#videoListResponse",
    items: [
      {
        id: TEST_VIDEO_ID,
        snippet: {
          title: "Day Trading crypto live",
          description: "Watch trading setups",
          channelTitle: "Finance Lab",
          publishedAt: "2026-09-05T12:00:00Z",
        },
      },
      {
        id: NOISE_VIDEO_ID,
        snippet: {
          title: "Cooking pasta at home",
          description: "No Radar keyword here",
          channelTitle: "Kitchen",
          publishedAt: "2026-09-05T12:00:00Z",
        },
      },
    ],
  };
}

async function cleanupTestSignals() {
  await prisma.signal.deleteMany({
    where: {
      source: YOUTUBE_SOURCE,
      value: { in: [TEST_VIDEO_ID, NOISE_VIDEO_ID] },
    },
  });
}

async function restoreSource(lastRunAt: Date | null) {
  await prisma.source.update({
    where: { slug: SOURCE_SLUGS.youtube },
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

  const previousKey = process.env.YOUTUBE_API_KEY;
  process.env.YOUTUBE_API_KEY = "test-key-not-sent";

  await prisma.source.update({
    where: { slug: SOURCE_SLUGS.youtube },
    data: { lastRunAt: null, lastError: null, status: "ACTIVE" },
  });

  const errors: string[] = [];
  const persisted = await runYoutubeCollection(["trading"], 10, errors, async () => mockPayload());
  const again = await runYoutubeCollection(["trading"], 10, errors, async () => mockPayload());

  const source = await prisma.source.findUnique({
    where: { slug: SOURCE_SLUGS.youtube },
  });
  const saved = await prisma.signal.findMany({
    where: { source: YOUTUBE_SOURCE, value: { in: [TEST_VIDEO_ID, NOISE_VIDEO_ID] } },
  });

  assert.equal(persisted, 1, "parser must keep only keyword matches");
  assert.equal(again, 1, "upsert must be idempotent");
  assert.equal(saved.length, 1);
  assert.equal(saved[0]?.value, TEST_VIDEO_ID);
  assert.equal(saved[0]?.type, "YOUTUBE_VIDEO");
  assert.ok(source?.lastRunAt, "youtube lastRunAt must be set after collection");
  assert.equal(source.lastError, null);
  assert.equal(source.status, "ACTIVE");
  assert.equal(errors.length, 0);
  const successRunAt = source.lastRunAt;

  console.log("youtube mock collect: ok");

  delete process.env.YOUTUBE_API_KEY;
  const beforeMissing = await prisma.signal.count({
    where: { source: YOUTUBE_SOURCE },
  });
  let fetchFnCalled = false;
  const missingErrors: string[] = [];
  const missingPersisted = await runYoutubeCollection(
    ["trading"],
    10,
    missingErrors,
    async () => {
      fetchFnCalled = true;
      return mockPayload();
    },
  );
  const afterMissing = await prisma.source.findUnique({
    where: { slug: SOURCE_SLUGS.youtube },
  });
  const afterMissingCount = await prisma.signal.count({
    where: { source: YOUTUBE_SOURCE },
  });

  assert.equal(fetchFnCalled, false, "missing key must not call fetchFn/API");
  assert.equal(missingPersisted, 0);
  assert.equal(afterMissingCount, beforeMissing, "missing key must not invent signals");
  assert.ok(afterMissing?.lastRunAt, "heartbeat still sets lastRunAt on ERROR");
  assert.equal(afterMissing.lastError, "YOUTUBE_API_KEY is missing");
  assert.equal(afterMissing.status, "ERROR");
  assert.ok(missingErrors[0]?.includes("YOUTUBE_API_KEY is missing"));

  console.log("youtube missing key: ok");

  await prisma.source.update({
    where: { slug: SOURCE_SLUGS.youtube },
    data: { lastRunAt: null, lastError: null, status: "ACTIVE" },
  });
  const empty = await prisma.source.findUnique({
    where: { slug: SOURCE_SLUGS.youtube },
  });
  let broke = false;
  try {
    assert.ok(empty?.lastRunAt, "youtube lastRunAt must be set after collection");
  } catch (error) {
    broke = true;
    console.log("NEGATIVE PROOF: test BREAKS when markSource is not called");
    console.log(error instanceof Error ? error.message : error);
  }
  assert.equal(broke, true, "negative proof must fail without markSource");

  if (previousKey === undefined) {
    delete process.env.YOUTUBE_API_KEY;
  } else {
    process.env.YOUTUBE_API_KEY = previousKey;
  }
  await cleanupTestSignals();
  await restoreSource(successRunAt);

  const select = await prisma.$queryRaw<
    { slug: string; lastRunAt: Date | null; lastError: string | null }[]
  >`
    SELECT slug, "lastRunAt", "lastError"
    FROM "Source"
    WHERE slug = 'youtube'
  `;
  console.log(JSON.stringify(select, null, 2));

  await prisma.$disconnect();
  console.log("youtube-heartbeat.test.ts ok");
}

main().catch(async (error: unknown) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
