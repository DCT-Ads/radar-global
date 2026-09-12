import { collectMuncheye } from "../lib/collectors/marketplace/muncheye";
import { persistMarketplaceLaunch } from "../lib/signals/persist-marketplace";
import { prisma } from "../lib/prisma";

const SOURCE_SLUG = "muncheye";

async function heartbeat(lastError: string | null) {
  await prisma.source.upsert({
    where: { slug: SOURCE_SLUG },
    update: {
      lastRunAt: new Date(),
      lastError,
      name: "MunchEye",
      reliability: 70,
    },
    create: {
      slug: SOURCE_SLUG,
      name: "MunchEye",
      reliability: 70,
      lastRunAt: new Date(),
      lastError,
    },
  });
}

async function main() {
  const result = await collectMuncheye();
  if (result.emptyReason && !result.items.length) {
    await heartbeat(result.emptyReason);
    throw new Error(result.emptyReason);
  }

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

  await heartbeat(errors[0] ?? null);

  console.log(
    `muncheye: ${created} novos / ${existing} já existiam (coletados ${result.items.length})`,
  );
  if (errors.length) {
    console.log(`erros: ${errors.join(" | ")}`);
  }
}

main()
  .catch((error) => {
    console.error("persist-muncheye falhou:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
