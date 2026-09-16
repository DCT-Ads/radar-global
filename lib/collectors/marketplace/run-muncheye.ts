import { persistMarketplaceLaunch } from "@/lib/signals/persist-marketplace";
import { persistHttpProbe } from "@/lib/collectors/persist";
import { probeLaunch } from "@/lib/collectors/http-probe";
import { formatRelativeTime } from "@/lib/format/relative-time";
import { prisma } from "@/lib/prisma";
import { applyMuncheyeKeyword } from "@/lib/signals/backfill-muncheye-keywords";
import { lastErrorIfEmpty, logDropStats } from "@/lib/collectors/drop-stats";
import { ensureSources, SOURCE_SLUGS } from "@/lib/sources";
import { collectMuncheye } from "./muncheye";

export const MUNCHEYE_SLUG = SOURCE_SLUGS.muncheye;

export type MuncheyeCardStats = {
  active: boolean;
  lastCollectAgo: string;
  newLaunches: number;
  enriched: number;
  missingKeywords: number;
  autoDaily: boolean;
};

async function heartbeat(lastError: string | null) {
  await prisma.source.upsert({
    where: { slug: MUNCHEYE_SLUG },
    update: {
      lastRunAt: new Date(),
      lastError,
      name: "MunchEye",
      reliability: 70,
    },
    create: {
      slug: MUNCHEYE_SLUG,
      name: "MunchEye",
      reliability: 70,
      lastRunAt: new Date(),
      lastError,
    },
  });
}

export async function countMuncheyeSignals() {
  const [newLaunches, enriched, missingKeywords] = await Promise.all([
    prisma.signal.count({ where: { source: MUNCHEYE_SLUG } }),
    prisma.signal.count({
      where: {
        source: MUNCHEYE_SLUG,
        OR: [{ launchId: { not: null } }, { enrichedAt: { not: null } }],
      },
    }),
    prisma.signal.count({
      where: {
        source: MUNCHEYE_SLUG,
        OR: [{ keyword: null }, { keyword: "" }],
      },
    }),
  ]);
  return { newLaunches, enriched, missingKeywords };
}

export async function getMuncheyeCardStats(locale: string): Promise<MuncheyeCardStats> {
  await ensureSources();
  const source = await prisma.source.findUnique({
    where: { slug: MUNCHEYE_SLUG },
  });
  const counts = await countMuncheyeSignals();
  const active = source?.status === "ACTIVE";
  return {
    active,
    lastCollectAgo: formatRelativeTime(source?.lastRunAt, locale),
    newLaunches: counts.newLaunches,
    enriched: counts.enriched,
    missingKeywords: counts.missingKeywords,
    autoDaily: active,
  };
}

export async function runMuncheyeCollection(options?: { skipEnrich?: boolean }) {
  await ensureSources();
  const result = await collectMuncheye();
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

  if (!options?.skipEnrich) {
    await enrichPendingMuncheyeSignals(errors);
  }

  const stats = {
    fetched: result.listed ?? result.items.length + result.errors.filter((item) =>
      item.startsWith("sem domínio real:"),
    ).length,
    keywordMiss: 0,
    noNiche: 0,
    tooOld: 0,
    apexMiss: 0,
    kept: result.items.length,
  };
  logDropStats("muncheye", stats);

  const lastError =
    result.emptyReason && result.items.length === 0
      ? result.emptyReason
      : lastErrorIfEmpty("muncheye", stats);
  await heartbeat(lastError);
  const counts = await countMuncheyeSignals();

  return {
    created,
    existing,
    collected: result.items.length,
    errors,
    lastError,
    collectedAt: new Date().toISOString(),
    ...counts,
  };
}

const MUNCHEYE_ENRICH_BATCH = 80;
const MUNCHEYE_ENRICH_CONCURRENCY = 8;

async function mapPool<T>(items: T[], concurrency: number, worker: (item: T) => Promise<void>) {
  const queue = [...items];
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, async () => {
      while (queue.length) {
        const item = queue.shift();
        if (item) {
          await worker(item);
        }
      }
    }),
  );
}

export async function enrichPendingMuncheyeSignals(errors: string[] = []) {
  const pending = await prisma.signal.findMany({
    where: {
      source: MUNCHEYE_SLUG,
      enrichedAt: null,
      domain: { not: null },
      status: { in: ["NEW", "ENRICHING", "CANDIDATE"] },
    },
    orderBy: { discoveredAt: "desc" },
    take: MUNCHEYE_ENRICH_BATCH,
  });

  await mapPool(pending, MUNCHEYE_ENRICH_CONCURRENCY, async (signal) => {
    const domain = signal.domain;
    if (!domain) {
      return;
    }
    try {
      await applyMuncheyeKeyword(signal);
      await prisma.signal.update({
        where: { id: signal.id },
        data: { status: "ENRICHING" },
      });
      const probe = await probeLaunch(domain);
      await persistHttpProbe(signal.id, probe);
      const after = await prisma.signal.findUnique({
        where: { id: signal.id },
        select: { status: true },
      });
      if (after?.status === "NEW" || after?.status === "ENRICHING") {
        await prisma.signal.update({
          where: { id: signal.id },
          data: { status: "CANDIDATE" },
        });
      }
      console.log(`[muncheye] enriched ${domain} live=${probe.landing.live}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "probe failed";
      console.error(`[muncheye] enrich failed ${domain}:`, message);
      errors.push(`muncheye probe ${domain}: ${message}`);
      await prisma.signal.update({
        where: { id: signal.id },
        data: { status: "NEW" },
      }).catch(() => undefined);
    }
  });

  return { attempted: pending.length, errors };
}

export async function setMuncheyeAutoDaily(enabled: boolean) {
  await ensureSources();
  await prisma.source.update({
    where: { slug: MUNCHEYE_SLUG },
    data: { status: enabled ? "ACTIVE" : "PAUSED" },
  });
}

export async function isMuncheyeAutoDaily() {
  await ensureSources();
  const source = await prisma.source.findUnique({
    where: { slug: MUNCHEYE_SLUG },
    select: { status: true },
  });
  return source?.status === "ACTIVE";
}
