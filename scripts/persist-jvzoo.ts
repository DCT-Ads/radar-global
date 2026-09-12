import { collectJvzoo } from "../lib/collectors/marketplace/jvzoo";
import { marketplaceLaunchToSignalPayload } from "../lib/collectors/marketplace/adapter";
import { persistMarketplaceLaunch } from "../lib/signals/persist-marketplace";
import { prisma } from "../lib/prisma";

async function replaceJvzooSignals() {
  const [total, withLaunch, withProducer, withEvidence] = await Promise.all([
    prisma.signal.count({ where: { source: "jvzoo" } }),
    prisma.signal.count({ where: { source: "jvzoo", launchId: { not: null } } }),
    prisma.signal.count({ where: { source: "jvzoo", producerId: { not: null } } }),
    prisma.signal.count({
      where: { source: "jvzoo", evidences: { some: {} } },
    }),
  ]);

  console.log(
    `JVZoo atuais: ${total} (launch=${withLaunch}, producer=${withProducer}, evidence=${withEvidence})`,
  );

  if (withLaunch || withProducer) {
    throw new Error(
      "Abortado: há Signals jvzoo ligados a Launch/Producer. Não apaguei nada.",
    );
  }

  if (withEvidence) {
    const detached = await prisma.evidence.updateMany({
      where: { signal: { source: "jvzoo" } },
      data: { signalId: null },
    });
    console.log(`Evidence desvinculada: ${detached.count}`);
  }

  const deleted = await prisma.signal.deleteMany({ where: { source: "jvzoo" } });
  console.log(`Apagados source=jvzoo: ${deleted.count}`);
  return deleted.count;
}

async function main() {
  await replaceJvzooSignals();

  const result = await collectJvzoo();
  let created = 0;
  let existing = 0;
  const errors = [...result.errors];
  const samples: Array<{
    value: string;
    domain: string | null;
    url: string | null;
    product_name: string;
  }> = [];

  for (const item of result.items) {
    try {
      const saved = await persistMarketplaceLaunch(item);
      if (saved.created && saved.signal) {
        created += 1;
        if (samples.length < 3) {
          const payload = marketplaceLaunchToSignalPayload(item);
          samples.push({
            value: saved.signal.value,
            domain: saved.signal.domain,
            url: saved.signal.url,
            product_name: payload.rawData.product_name,
          });
        }
      } else {
        existing += 1;
      }
    } catch (error) {
      errors.push(
        `${item.product_name}: ${error instanceof Error ? error.message : "persist failed"}`,
      );
    }
  }

  const remainingOld = await prisma.signal.count({
    where: { source: "jvzoo", NOT: { value: { startsWith: "jvzoo:" } } },
  });

  console.log("\n========== jvzoo persist (Passo A / pid) ==========");
  console.log(`jvzoo: ${created} novos / ${existing} já existiam (coletados ${result.items.length})`);
  console.log(`órfãos antigos (value sem jvzoo:pid): ${remainingOld}`);
  if (errors.length) {
    console.log(`erros: ${errors.join(" | ")}`);
  }
  console.log("amostra:");
  for (const [index, row] of samples.entries()) {
    console.log(
      `  ${index + 1}. ${row.product_name}\n     value=${row.value}\n     domain=${row.domain}\n     url=${row.url}`,
    );
  }
}

main()
  .catch((error) => {
    console.error("persist-jvzoo falhou:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
