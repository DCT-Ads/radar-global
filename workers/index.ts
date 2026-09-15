import { Worker } from "bullmq";
import { runCrtshCollection } from "../lib/collectors/run-collection";
import { runPendingNrdReprobe } from "../lib/collectors/reprobe-nrd";
import { COLLECT_JOB_NAME, COLLECT_QUEUE_NAME, drainStaleCollectJobs, scheduleCollectCron } from "../lib/queue/collect";
import { REPROBE_JOB_NAME, scheduleReprobeCron } from "../lib/queue/reprobe";
import { getRedis } from "../lib/queue/connection";

async function main() {
  const connection = getRedis();
  if (!connection) {
    console.error("REDIS_URL is required to run the worker");
    process.exit(1);
  }

  const cleared = await drainStaleCollectJobs();
  if (cleared > 0) {
    console.log(`Cleared ${cleared} leftover collect/reprobe job(s)`);
  }

  const collectScheduled = await scheduleCollectCron();
  const reprobeScheduled = await scheduleReprobeCron();
  console.log(
    collectScheduled
      ? "Collect cron registered (every 6h)"
      : "Collect cron skipped",
  );
  console.log(
    reprobeScheduled
      ? "NRD re-probe cron registered (every 6h)"
      : "NRD re-probe cron skipped",
  );

  const worker = new Worker(
    COLLECT_QUEUE_NAME,
    async (job) => {
      console.log(`Starting ${job.name} (${job.id})`);
      if (job.name === REPROBE_JOB_NAME) {
        const result = await runPendingNrdReprobe("worker");
        console.log(
          `Finished ${job.name}: probed=${result.probed} wentLive=${result.wentLive} pendingLeft=${result.pendingLeft} errors=${result.errors.length}`,
        );
        return result;
      }
      const result = await runCrtshCollection();
      console.log(
        `Finished ${job.name}: discovered=${result.discovered} probed=${result.probed} errors=${result.errors.length}`,
      );
      return result;
    },
    {
      connection,
      concurrency: 1,
      removeOnComplete: { count: 20 },
      removeOnFail: { count: 50 },
    },
  );

  worker.on("failed", (job, error) => {
    console.error(`Job ${job?.id} failed:`, error);
  });

  console.log(`Worker listening on ${COLLECT_QUEUE_NAME}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
