import { prisma } from "../lib/prisma";

const BATCH_SIZE = 100;

type DupRow = {
  domain: string;
  ids: string[];
};

async function main() {
  const groups = await prisma.$queryRaw<DupRow[]>`
    SELECT domain, array_agg(id ORDER BY "createdAt" ASC) AS ids
    FROM "Signal"
    WHERE status = 'NEW'
      AND domain IS NOT NULL
    GROUP BY domain
    HAVING COUNT(*) > 1
  `;

  const removeIds = groups.flatMap((group) => group.ids.slice(1));
  let signals_removidos = 0;

  console.log(
    `[dedupe] ${groups.length} domains with NEW duplicates · ${removeIds.length} to delete`,
  );

  for (let index = 0; index < removeIds.length; index += BATCH_SIZE) {
    const batch = removeIds.slice(index, index + BATCH_SIZE);
    const deleted = await prisma.$transaction(async (tx) => {
      await tx.evidence.updateMany({
        where: { signalId: { in: batch } },
        data: { signalId: null },
      });
      const result = await tx.signal.deleteMany({
        where: {
          id: { in: batch },
          status: "NEW",
        },
      });
      return result.count;
    });
    signals_removidos += deleted;
    console.log(
      `[dedupe] lote ${Math.floor(index / BATCH_SIZE) + 1} removed=${deleted} afterId=${batch[batch.length - 1]}`,
    );
  }

  console.table({
    dominios_afetados: groups.length,
    signals_removidos,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
