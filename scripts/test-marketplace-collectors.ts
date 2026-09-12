import {
  collectClickbank,
  collectJvzoo,
  collectMuncheye,
  type MarketplaceCollectResult,
} from "../lib/collectors/marketplace";
import { collectWarriorplus } from "../lib/collectors/marketplace/warriorplus";

function printResult(result: MarketplaceCollectResult) {
  console.log(`\n========== ${result.source} ==========`);
  console.log(`itens reais: ${result.items.length}`);
  console.log(`http: ${result.httpStatus ?? "-"}`);
  console.log(`url final: ${result.finalUrl ?? "-"}`);
  if (result.emptyReason) {
    console.log(`motivo vazio: ${result.emptyReason}`);
  }
  if (result.errors.length) {
    console.log(`erros: ${result.errors.join(" | ")}`);
  }
  for (const [index, item] of result.items.slice(0, 3).entries()) {
    console.log(
      `  ${index + 1}. ${item.product_name} | vendor=${item.vendor ?? "-"} | date=${item.launch_date ?? "-"} | ${item.status}`,
    );
    console.log(`     ${item.url}`);
  }
}

async function main() {
  const results = [
    await collectMuncheye(),
    await collectWarriorplus(),
    await collectClickbank(),
    await collectJvzoo(),
  ];

  for (const result of results) {
    printResult(result);
  }

  console.log("\n========== resumo ==========");
  for (const result of results) {
    console.log(
      `${result.source}: ${result.items.length}${result.emptyReason ? ` (${result.emptyReason})` : ""}`,
    );
  }
}

main().catch((error) => {
  console.error("teste marketplace falhou:", error);
  process.exit(1);
});
