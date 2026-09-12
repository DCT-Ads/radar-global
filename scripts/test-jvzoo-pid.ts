import { collectJvzoo } from "../lib/collectors/marketplace/jvzoo";
import { marketplaceLaunchToSignalPayload } from "../lib/collectors/marketplace/adapter";

async function main() {
  const result = await collectJvzoo({ maxPages: 3 });
  const values = new Set<string>();
  let dupValues = 0;

  console.log("\n========== jvzoo TESTE (3 páginas, sem gravar, sem apagar) ==========");
  console.log(`coletados: ${result.items.length}`);
  if (result.errors.length) {
    console.log(`erros: ${result.errors.join(" | ")}`);
  }

  for (const item of result.items) {
    const payload = marketplaceLaunchToSignalPayload(item);
    if (values.has(payload.value)) {
      dupValues += 1;
    }
    values.add(payload.value);
  }

  console.log(`values únicos: ${values.size} / dups de value: ${dupValues}`);
  console.log("amostra (até 5):");
  for (const [index, item] of result.items.slice(0, 5).entries()) {
    const payload = marketplaceLaunchToSignalPayload(item);
    console.log(
      `  ${index + 1}. ${payload.rawData.product_name}\n     value=${payload.value}\n     domain=${payload.domain}\n     url=${payload.url}`,
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
