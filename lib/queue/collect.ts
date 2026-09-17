import { Queue } from "bullmq";
import { getRedis } from "./connection";
import { runCrtshCollection, type CollectionResult } from "@/lib/collectors/run-collection";

export const COLLECT_QUEUE_NAME = "radar-collect";
export const COLLECT_JOB_NAME = "crtsh-scan";
export const COLLECT_REPEAT_EVERY_MS = 6 * 60 * 60 * 1000;
export const MANUAL_COLLECT_JOB_ID = "collect-manual";
export const MANUAL_REPROBE_JOB_ID = "reprobe-manual";

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
    try {
      await queue.add(
        COLLECT_JOB_NAME,
        { triggeredAt: new Date().toISOString() },
        {
          jobId: MANUAL_COLLECT_JOB_ID,
          removeOnComplete: 20,
          removeOnFail: 50,
        },
      );
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes("already exists")) {
        throw error;
      }
    }
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
    {
      name: COLLECT_JOB_NAME,
      data: { kind: "cron" },
      opts: { removeOnComplete: 10, removeOnFail: 20 },
    },
  );
  return true;
}

export async function drainStaleCollectJobs() {
  const queue = getCollectQueue();
  if (!queue) {
    return 0;
  }
  const waiting = await queue.getJobs(["waiting"]);
  let removed = 0;
  for (const job of waiting) {
    const id = String(job.id ?? "");
    const repeat = Boolean(job.repeatJobKey) || id.startsWith("repeat:");
    if (repeat) {
      continue;
    }
    if (job.name === COLLECT_JOB_NAME || job.name === "nrd-reprobe") {
      await job.remove();
      removed += 1;
    }
  }
  return removed;
}
