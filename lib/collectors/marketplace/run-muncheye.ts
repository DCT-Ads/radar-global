import { persistMarketplaceLaunch } from "@/lib/signals/persist-marketplace";
import { formatRelativeTime } from "@/lib/format/relative-time";
import { prisma } from "@/lib/prisma";
import { ensureSources, SOURCE_SLUGS } from "@/lib/sources";
import { collectMuncheye } from "./muncheye";

export const MUNCHEYE_SLUG = SOURCE_SLUGS.muncheye;

export type MuncheyeCardStats = {
  active: boolean;
  lastCollectAgo: string;
  newLaunches: number;
  enriched: number;
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
  const [newLaunches, enriched] = await Promise.all([
    prisma.signal.count({ where: { source: MUNCHEYE_SLUG } }),
    prisma.signal.count({
      where: { source: MUNCHEYE_SLUG, launchId: { not: null } },
    }),
  ]);
  return { newLaunches, enriched };
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
    autoDaily: active,
  };
}

export async function runMuncheyeCollection() {
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

  const lastError =
    result.emptyReason && result.items.length === 0
      ? result.emptyReason
      : (errors[0] ?? null);
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
