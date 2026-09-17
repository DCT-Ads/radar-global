import "dotenv/config";
import { prisma } from "../lib/prisma";
import { runCrtshOnly } from "../lib/collectors/run-collection";

function isTransientDbError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /can't reach database|timed out fetching a new connection|P1001/i.test(
    message,
  );
}

async function withRetry<T>(
  label: string,
  fn: () => Promise<T>,
  tries = 5,
  baseMs = 1_500,
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= tries; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastErr = error;
      if (!isTransientDbError(error) || attempt === tries) {
        throw error;
      }
      const wait = baseMs * 2 ** (attempt - 1);
      console.warn(`[${label}] tentativa ${attempt}/${tries} falhou. Retry em ${wait}ms...`);
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
  }
  throw lastErr;
}

async function main() {
  const startedAt = Date.now();

  console.log("Acordando o Neon (SELECT 1)...");
  await withRetry("wake", () => prisma.$queryRaw`SELECT 1`);
  console.log("Neon acordado.\n");

  console.log("Rodando coletor crt.sh isolado...");
  const result = await runCrtshOnly();
  const took = ((Date.now() - startedAt) / 1000).toFixed(1);
  const stats = result.dropStats?.crtsh;
  console.log(
    `crt.sh concluido em ${took}s → fetched=${stats?.fetched ?? "?"} kept=${stats?.kept ?? result.discovered} probed=${result.probed} errors=${JSON.stringify(result.errors)}\n`,
  );
}

main()
  .catch(async (error: unknown) => {
    console.error("Falhou:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
