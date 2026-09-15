import { getCollectQueue, COLLECT_REPEAT_EVERY_MS, MANUAL_REPROBE_JOB_ID } from "./collect";
import { runPendingNrdReprobe, type ReprobeResult } from "@/lib/collectors/reprobe-nrd";

export const REPROBE_JOB_NAME = "nrd-reprobe";

export async function enqueueOrRunReprobe(
  kind: "inline" | "cron" = "inline",
): Promise<{ mode: "queued" } | { mode: "inline"; result: ReprobeResult }> {
  const queue = getCollectQueue();
  if (queue) {
    try {
      await queue.add(
        REPROBE_JOB_NAME,
        { triggeredAt: new Date().toISOString() },
        {
          jobId: MANUAL_REPROBE_JOB_ID,
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
  const result = await runPendingNrdReprobe(kind === "cron" ? "cron" : "inline");
  return { mode: "inline", result };
}

export async function scheduleReprobeCron() {
  const queue = getCollectQueue();
  if (!queue) {
    return false;
  }
  await queue.upsertJobScheduler(
    "nrd-reprobe-every-6h",
    { every: COLLECT_REPEAT_EVERY_MS },
    {
      name: REPROBE_JOB_NAME,
      data: { kind: "cron" },
      opts: { removeOnComplete: 10, removeOnFail: 20 },
    },
  );
  return true;
}
