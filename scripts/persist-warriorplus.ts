import { collectWarriorplus } from "../lib/collectors/marketplace/warriorplus";
import { marketplaceLaunchToSignalPayload } from "../lib/collectors/marketplace/adapter";
import { persistMarketplaceLaunch } from "../lib/signals/persist-marketplace";
import { prisma } from "../lib/prisma";

async function main() {
  const result = await collectWarriorplus({ maxPages: 3 });
  let created = 0;
  let existing = 0;
  const errors = [...result.errors];
  const createdSignals: Array<{
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
        const payload = marketplaceLaunchToSignalPayload(item);
        createdSignals.push({
          value: saved.signal.value,
          domain: saved.signal.domain,
          url: saved.signal.url,
          product_name: payload.rawData.product_name,
        });
      } else {
        existing += 1;
      }
    } catch (error) {
      errors.push(
        `${item.product_name}: ${error instanceof Error ? error.message : "persist failed"}`,
      );
    }
  }

  console.log("\n========== warriorplus persist (teste 3 páginas / home) ==========");
  console.log(`warriorplus: ${created} novos / ${existing} já existiam (coletados ${result.items.length})`);
  if (errors.length) {
    console.log(`erros: ${errors.join(" | ")}`);
  }
  console.log("amostra (até 3):");
  for (const [index, row] of createdSignals.slice(0, 3).entries()) {
    console.log(
      `  ${index + 1}. ${row.product_name}\n     value=${row.value}\n     domain=${row.domain}\n     url=${row.url}`,
    );
  }
}

main()
  .catch((error) => {
    console.error("persist-warriorplus falhou:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
