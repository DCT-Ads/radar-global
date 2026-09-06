import { runNrdCollection } from "../lib/collectors/run-collection";
import { prisma } from "../lib/prisma";
import { ALL_KEYWORDS } from "../lib/niches";

async function main() {
  const maxHits = Number(process.env.COLLECT_MAX_DOMAINS ?? 40);
  const keywords = process.env.COLLECT_KEYWORDS?.split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const errors: string[] = [];
  const persisted = await runNrdCollection(
    keywords?.length ? keywords : ALL_KEYWORDS,
    maxHits,
    errors,
  );

  const source = await prisma.source.findUnique({
    where: { slug: "whoisds" },
    select: { lastRunAt: true, lastError: true },
  });

  console.log(
    JSON.stringify(
      {
        persisted,
        errors,
        lastRunAt: source?.lastRunAt?.toISOString() ?? null,
        lastError: source?.lastError ?? null,
      },
      null,
      2,
    ),
  );
  await prisma.$disconnect();
}

main();
