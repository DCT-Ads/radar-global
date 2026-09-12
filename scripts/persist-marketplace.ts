import { collectJvzoo } from "../lib/collectors/marketplace/jvzoo";
import { collectMuncheye } from "../lib/collectors/marketplace/muncheye";
import { persistMarketplaceLaunch } from "../lib/signals/persist-marketplace";
import { prisma } from "../lib/prisma";
import type { MarketplaceCollectResult } from "../lib/collectors/marketplace/types";

async function persistSource(result: MarketplaceCollectResult) {
  let created = 0;
  let existing = 0;
  const errors = [...result.errors];

  for (const item of result.items) {
    try {
      const saved = await persistMarketplaceLaunch(item);
      if (saved.created) {
        created += 1;
      } else {
        existing += 1;
      }
    } catch (error) {
      errors.push(
        `${item.product_name}: ${error instanceof Error ? error.message : "persist failed"}`,
      );
    }
  }

  return { created, existing, errors, collected: result.items.length };
}

async function main() {
  const muncheye = await persistSource(await collectMuncheye());
  const jvzoo = await persistSource(await collectJvzoo());

  const [total, fila] = await Promise.all([
    prisma.signal.count(),
    prisma.signal.count({
      where: { status: { in: ["NEW", "ENRICHING", "CANDIDATE"] } },
    }),
  ]);

  console.log("\n========== persistência ==========");
  console.log(
    `muncheye: ${muncheye.created} novos / ${muncheye.existing} já existiam (coletados ${muncheye.collected})`,
  );
  if (muncheye.errors.length) {
    console.log(`muncheye erros: ${muncheye.errors.join(" | ")}`);
  }
  console.log(
    `jvzoo: ${jvzoo.created} novos / ${jvzoo.existing} já existiam (coletados ${jvzoo.collected})`,
  );
  if (jvzoo.errors.length) {
    console.log(`jvzoo erros: ${jvzoo.errors.join(" | ")}`);
  }
  console.log(`Signals total: ${total}`);
  console.log(`Signals na fila (NEW/ENRICHING/CANDIDATE): ${fila}`);
}

main()
  .catch((error) => {
    console.error("persist-marketplace falhou:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
