import { NRD_SOURCE } from "@/lib/collectors/nrd";
import { prisma } from "@/lib/prisma";
import {
  getSaturationLevel,
  indexKeywordVolumes,
  isUpcomingLaunch,
  landingLiveFromRaw,
  type SaturationLevel,
} from "@/lib/signals/saturation";

export const DASHBOARD_OTHERS_SOURCE = "__others__";
const SOURCE_BAR_CAP = 8;

export type DashboardPoint = { date: string; count: number };
export type DashboardBar = { label: string; count: number };
export type DashboardSaturation = { level: SaturationLevel; count: number };
export type DashboardRecentSignal = {
  id: string;
  name: string;
  source: string;
  saturation: SaturationLevel | null;
  createdAt: string;
};
export type DashboardLast24h = {
  count: number;
  previous: number;
  deltaPct: number | null;
  isNew: boolean;
  topSource: { label: string; count: number } | null;
};

export type DashboardStats = {
  total: number;
  hot: number;
  upcoming: number;
  verified: number;
  last24h: DashboardLast24h;
  timeline: DashboardPoint[];
  saturation: DashboardSaturation[];
  niches: DashboardBar[];
  signalsBySource: DashboardBar[];
  recentSignals: DashboardRecentSignal[];
};

function capSourceBars(bars: DashboardBar[]): DashboardBar[] {
  const sorted = [...bars].sort((a, b) => b.count - a.count);
  if (sorted.length <= SOURCE_BAR_CAP) {
    return sorted;
  }
  const top = sorted.slice(0, SOURCE_BAR_CAP);
  const rest = sorted
    .slice(SOURCE_BAR_CAP)
    .reduce((sum, row) => sum + row.count, 0);
  if (rest <= 0) {
    return top;
  }
  return [...top, { label: DASHBOARD_OTHERS_SOURCE, count: rest }];
}

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function emptyDays(days: number): DashboardPoint[] {
  const points: DashboardPoint[] = [];
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i -= 1) {
    const day = new Date(now);
    day.setUTCDate(now.getUTCDate() - i);
    points.push({ date: dayKey(day), count: 0 });
  }
  return points;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 29);
  since.setUTCHours(0, 0, 0, 0);

  const now = new Date();
  const last24hStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const prev24hStart = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  const [
    total,
    verified,
    keywordCounts,
    nicheCounts,
    sourceCounts,
    last24hCount,
    previous24hCount,
    last24hSources,
    recent,
    latest,
    nrdSignals,
  ] = await Promise.all([
      prisma.signal.count(),
      prisma.signal.count({ where: { status: "VERIFIED" } }),
      prisma.signal.groupBy({
        by: ["keyword"],
        where: { status: { not: "DISCARDED" } },
        _count: { _all: true },
      }),
      prisma.signal.groupBy({
        by: ["niche"],
        where: { status: { not: "DISCARDED" }, niche: { not: null } },
        _count: { _all: true },
      }),
      prisma.signal.groupBy({
        by: ["source"],
        _count: { _all: true },
      }),
      prisma.signal.count({ where: { createdAt: { gte: last24hStart } } }),
      prisma.signal.count({
        where: { createdAt: { gte: prev24hStart, lt: last24hStart } },
      }),
      prisma.signal.groupBy({
        by: ["source"],
        where: { createdAt: { gte: last24hStart } },
        _count: { _all: true },
      }),
      prisma.signal.findMany({
        where: { discoveredAt: { gte: since } },
        select: { discoveredAt: true },
      }),
      prisma.signal.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          domain: true,
          value: true,
          source: true,
          keyword: true,
          createdAt: true,
        },
      }),
      prisma.signal.findMany({
        where: { source: NRD_SOURCE, status: { not: "DISCARDED" } },
        select: { source: true, rawData: true },
      }),
    ]);

  const { byKeyword, median, p75 } = indexKeywordVolumes(keywordCounts);
  const saturationTally: Record<SaturationLevel, number> = {
    SATURATED: 0,
    WARNING: 0,
    SAFE: 0,
  };

  for (const row of keywordCounts) {
    if (!row.keyword) {
      continue;
    }
    const volume = byKeyword[row.keyword] ?? row._count._all;
    const level = getSaturationLevel({
      keyword: row.keyword,
      keywordVolume: volume,
      medianVolume: median,
      p75Volume: p75,
      confidence: 50,
      firstSeenDaysAgo: 0,
    });
    if (level) {
      saturationTally[level] += row._count._all;
    }
  }

  const byDay = new Map(emptyDays(30).map((point) => [point.date, point.count]));
  for (const signal of recent) {
    const key = dayKey(signal.discoveredAt);
    byDay.set(key, (byDay.get(key) ?? 0) + 1);
  }

  const upcoming = nrdSignals.filter((signal) =>
    isUpcomingLaunch({
      source: signal.source,
      landingLive: landingLiveFromRaw(signal.rawData),
    }),
  ).length;

  const topSourceRow = [...last24hSources].sort(
    (a, b) => b._count._all - a._count._all,
  )[0];

  const last24h: DashboardLast24h = {
    count: last24hCount,
    previous: previous24hCount,
    deltaPct:
      previous24hCount === 0
        ? null
        : Math.round(((last24hCount - previous24hCount) / previous24hCount) * 100),
    isNew: previous24hCount === 0 && last24hCount > 0,
    topSource: topSourceRow
      ? { label: topSourceRow.source, count: topSourceRow._count._all }
      : null,
  };

  return {
    total,
    hot: saturationTally.SAFE,
    upcoming,
    verified,
    last24h,
    timeline: [...byDay.entries()].map(([date, count]) => ({ date, count })),
    saturation: [
      { level: "SATURATED", count: saturationTally.SATURATED },
      { level: "WARNING", count: saturationTally.WARNING },
      { level: "SAFE", count: saturationTally.SAFE },
    ],
    niches: nicheCounts
      .map((row) => ({
        label: row.niche ?? "—",
        count: row._count._all,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6),
    signalsBySource: capSourceBars(
      sourceCounts.map((row) => ({
        label: row.source,
        count: row._count._all,
      })),
    ),
    recentSignals: latest.map((signal) => {
      const volume = signal.keyword
        ? (byKeyword[signal.keyword] ?? 1)
        : 0;
      return {
        id: signal.id,
        name: signal.domain || signal.value,
        source: signal.source,
        saturation: getSaturationLevel({
          keyword: signal.keyword,
          keywordVolume: volume,
          medianVolume: median,
          p75Volume: p75,
          confidence: 50,
          firstSeenDaysAgo: 0,
        }),
        createdAt: signal.createdAt.toISOString(),
      };
    }),
  };
}
