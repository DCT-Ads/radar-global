import "dotenv/config";
import { DEFAULT_CRTSH_CONFIG } from "../lib/collectors/config";
import {
  runCrtshOnly,
  runNrdCollection,
  runDigistore24Collection,
  runYoutubeCollection,
} from "../lib/collectors/run-collection";
import { runMuncheyeCollection } from "../lib/collectors/marketplace/run-muncheye";
import { runPendingNrdReprobe } from "../lib/collectors/reprobe-nrd";
import { prisma } from "../lib/prisma";

// argumentos default de coleta (ajuste keywords/maxHits ao seu caso)
const KEYWORDS: string[] = []; // vazio = usa o default interno de cada coletor
const MAX_HITS = 50;

function resolveKeywords() {
  return KEYWORDS.length ? KEYWORDS : DEFAULT_CRTSH_CONFIG.keywords;
}

const COLLECTORS: Record<string, () => Promise<unknown>> = {
  crtsh: () => runCrtshOnly(),
  whoisds: () => runNrdCollection(resolveKeywords(), MAX_HITS, []),
  digistore24: () => runDigistore24Collection(resolveKeywords(), MAX_HITS, []),
  youtube: () => runYoutubeCollection(resolveKeywords(), MAX_HITS, []),
  muncheye: () =>
    runMuncheyeCollection({
      scheduled: process.env.GITHUB_EVENT_NAME === "schedule",
    }),
  http_probe: () => runPendingNrdReprobe("inline"),
};

async function withRetries<T>(fn: () => Promise<T>, tries = 3, delayMs = 5000): Promise<T> {
  let lastErr: unknown;
  for (let i = 1; i <= tries; i += 1) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      console.error(`[tentativa ${i}/${tries}] falhou:`, err);
      if (i < tries) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }
  throw lastErr;
}

async function main() {
  const slug = process.argv[2];
  const run = slug ? COLLECTORS[slug] : undefined;

  if (!slug || !run) {
    console.error("Uso: npx tsx scripts/run-collector.ts <slug>");
    console.error(`Slugs validos: ${Object.keys(COLLECTORS).join(", ")}`);
    process.exit(1);
  }

  console.log(`Rodando coletor: ${slug}`);
  const start = Date.now();

  try {
    const result = await withRetries(run);
    console.log(
      `${slug} concluido em ${((Date.now() - start) / 1000).toFixed(1)}s → ${JSON.stringify(result ?? {})}`,
    );
    process.exit(0);
  } catch (err) {
    console.error(`${slug} falhou apos retries:`, err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
