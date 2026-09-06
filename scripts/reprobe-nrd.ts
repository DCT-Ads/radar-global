import { runPendingNrdReprobe } from "../lib/collectors/reprobe-nrd";
import { prisma } from "../lib/prisma";

async function main() {
  const result = await runPendingNrdReprobe("cron");
  console.log(JSON.stringify(result, null, 2));
  await prisma.$disconnect();
}

main();
