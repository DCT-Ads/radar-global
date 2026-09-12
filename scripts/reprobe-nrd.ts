import { runPendingNrdReprobe } from "../lib/collectors/reprobe-nrd";
import { prisma } from "../lib/prisma";

function parseArgs(argv: string[]) {
  const dryRun = argv.includes("--dry-run");
  const force = argv.includes("--force");
  const alreadyLive = argv.includes("--already-live");
  const maxRaw = argv.find((arg) => arg.startsWith("--max="))?.slice("--max=".length);
  const maxPerRun = maxRaw ? Number(maxRaw) : undefined;
  return {
    dryRun,
    force,
    alreadyLive,
    maxPerRun:
      maxPerRun !== undefined && Number.isFinite(maxPerRun) ? maxPerRun : undefined,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  console.log(
    `[reprobe] start dryRun=${options.dryRun} force=${options.force} alreadyLive=${options.alreadyLive} max=${options.maxPerRun ?? "default"}`,
  );
  const result = await runPendingNrdReprobe("inline", options);
  console.log(JSON.stringify(result, null, 2));
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error("❌ Erro:", error);
  await prisma.$disconnect();
  process.exit(1);
});
