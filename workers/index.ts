import { Worker } from "bullmq";
import { runCrtshCollection } from "../lib/collectors/run-collection";
import { COLLECT_JOB_NAME, COLLECT_QUEUE_NAME, scheduleCollectCron } from "../lib/queue/collect";
import { getRedis } from "../lib/queue/connection";

async function main() {
  const connection = getRedis();
  if (!connection) {
    console.error("REDIS_URL is required to run the worker");
    process.exit(1);
  }

  const scheduled = await scheduleCollectCron();
  console.log(
    scheduled
      ? "Collect cron registered (every 6h)"
      : "Collect cron skipped",
  );

  const worker = new Worker(
    COLLECT_QUEUE_NAME,
    async (job) => {
      console.log(`Starting ${job.name} (${job.id})`);
      const result = await runCrtshCollection();
      console.log(
        `Finished ${job.name}: discovered=${result.discovered} probed=${result.probed} errors=${result.errors.length}`,
      );
      return result;
    },
    {
      connection,
      concurrency: 1,
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
