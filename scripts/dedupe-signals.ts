import { prisma } from "../lib/prisma";
import { isEnrichedSignal } from "../lib/signals/filled-fields";
import { backupSignals } from "./backup-signals";
import { confirmSignalDelete } from "./confirm-signal-delete";

const BATCH_SIZE = 100;

type DupRow = {
  domain: string;
  ids: string[];
};

async function main() {
  await backupSignals("dedupe-signals");

  const groups = await prisma.$queryRaw<DupRow[]>`
    SELECT domain, array_agg(id ORDER BY "createdAt" ASC) AS ids
    FROM "Signal"
    WHERE status = 'NEW'
      AND domain IS NOT NULL
    GROUP BY domain
    HAVING COUNT(*) > 1
  `;

  const candidateIds = groups.flatMap((group) => group.ids.slice(1));
  const protectedRows = await prisma.signal.findMany({
    where: { id: { in: candidateIds } },
    select: {
      id: true,
      confidence: true,
      niche: true,
      countryHint: true,
      enrichedAt: true,
    },
  });
  const protectedIds = new Set(
    protectedRows.filter((row) => isEnrichedSignal(row)).map((row) => row.id),
  );
  const removeIds = candidateIds.filter((id) => !protectedIds.has(id));

  console.log(
    `[dedupe] ${groups.length} domains · ${candidateIds.length} dups · ${protectedIds.size} protegidos · ${removeIds.length} a apagar`,
  );

  if (!removeIds.length) {
    return;
  }

  await confirmSignalDelete(
    `Vai apagar ${removeIds.length} signals NEW sem enriquecimento (dups de domínio).`,
  );

  let signals_removidos = 0;
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
          confidence: 0,
          niche: null,
          countryHint: null,
          enrichedAt: null,
        },
      });
      return result.count;
    });
    signals_removidos += deleted;
    console.log(
      `[dedupe] lote ${Math.floor(index / BATCH_SIZE) + 1} removed=${deleted}`,
    );
  }

  console.table({
    dominios_afetados: groups.length,
    protegidos: protectedIds.size,
    signals_removidos,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
