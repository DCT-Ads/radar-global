import { getCollectQueue, COLLECT_REPEAT_EVERY_MS } from "./collect";
import { runPendingNrdReprobe, type ReprobeResult } from "@/lib/collectors/reprobe-nrd";

export const REPROBE_JOB_NAME = "nrd-reprobe";

export async function enqueueOrRunReprobe(
  kind: "inline" | "cron" = "inline",
): Promise<{ mode: "queued" } | { mode: "inline"; result: ReprobeResult }> {
  const queue = getCollectQueue();
  if (queue) {
    await queue.add(
      REPROBE_JOB_NAME,
      { triggeredAt: new Date().toISOString() },
      {
        removeOnComplete: 20,
        removeOnFail: 50,
      },
    );
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
    { name: REPROBE_JOB_NAME, data: { kind: "cron" } },
  );
  return true;
}
