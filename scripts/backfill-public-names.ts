import { PrismaClient } from "@prisma/client";
import { cleanPublicName } from "../lib/text/public-name";

const prisma = new PrismaClient();

const DRY_RUN = process.argv.includes("--dry-run");

async function backfillNames(
  label: string,
  rows: Array<{ id: string; domain: string; current: string }>,
  persist: (id: string, cleaned: string) => Promise<unknown>,
) {
  console.log(`🔍 ${rows.length} ${label} com nome preenchido.`);

  let changed = 0;
  let skipped = 0;

  for (const row of rows) {
    const cleaned = cleanPublicName(row.current);

    if (!cleaned || cleaned === row.current) {
      skipped++;
      continue;
    }

    console.log(
      `• ${row.domain ?? row.id}\n    antes: ${JSON.stringify(row.current)}\n    depois: ${JSON.stringify(cleaned)}`,
    );

    if (!DRY_RUN) {
      await persist(row.id, cleaned);
    }
    changed++;
  }

  console.log(
    `   ${changed} ${DRY_RUN ? "seriam alterados" : "alterados"}, ${skipped} inalterados.\n`,
  );
}

async function main() {
  if (DRY_RUN) console.log("⚠️  DRY-RUN: nada será gravado.\n");

  const producers = await prisma.producer.findMany({
    select: { id: true, name: true, domain: true },
  });

  await backfillNames(
    "producers",
    producers.map((p) => ({ id: p.id, domain: p.domain, current: p.name })),
    (id, name) => prisma.producer.update({ where: { id }, data: { name } }),
  );

  const launches = await prisma.launch.findMany({
    select: { id: true, title: true, domain: true },
  });

  await backfillNames(
    "launches",
    launches.map((l) => ({ id: l.id, domain: l.domain, current: l.title })),
    (id, title) => prisma.launch.update({ where: { id }, data: { title } }),
  );

  console.log("✅ Concluído.");
}

main()
  .catch((err) => {
    console.error("❌ Erro no backfill:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
