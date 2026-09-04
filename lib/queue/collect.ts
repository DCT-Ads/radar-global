import { Queue } from "bullmq";
import { getRedis } from "./connection";
import { runCrtshCollection, type CollectionResult } from "@/lib/collectors/run-collection";

export const COLLECT_QUEUE_NAME = "radar-collect";
export const COLLECT_JOB_NAME = "crtsh-scan";
export const COLLECT_REPEAT_EVERY_MS = 6 * 60 * 60 * 1000;

export function getCollectQueue() {
  const connection = getRedis();
  if (!connection) {
    return null;
  }
  return new Queue(COLLECT_QUEUE_NAME, { connection });
}

export async function enqueueOrRunCollection(): Promise<
  { mode: "queued" } | { mode: "inline"; result: CollectionResult }
> {
  const queue = getCollectQueue();
  if (queue) {
    await queue.add(
      COLLECT_JOB_NAME,
      { triggeredAt: new Date().toISOString() },
      {
        removeOnComplete: 20,
        removeOnFail: 50,
      },
    );
    return { mode: "queued" };
  }
  const result = await runCrtshCollection();
  return { mode: "inline", result };
}

export async function scheduleCollectCron() {
  const queue = getCollectQueue();
  if (!queue) {
    return false;
  }
  await queue.upsertJobScheduler(
    "crtsh-scan-every-6h",
    { every: COLLECT_REPEAT_EVERY_MS },
    { name: COLLECT_JOB_NAME, data: { kind: "cron" } },
  );
  return true;
}
