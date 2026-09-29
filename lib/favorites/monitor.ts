import { prisma } from "@/lib/prisma";
import { radarLaunchInclude, toRadarLaunchRow, type RadarLaunchRow } from "@/lib/radar/list";
import { loadKeywordVolumeIndex } from "@/lib/signals/keyword-volume";

export type MonitoredLaunchRow = RadarLaunchRow & {
  favoritedAt: Date;
  changedSinceSave: boolean;
  changedThisWeek: boolean;
};

export async function listFavoriteLaunchIds(userId: string): Promise<Set<string>> {
  const rows = await prisma.favorite.findMany({
    where: { userId },
    select: { launchId: true },
  });
  return new Set(rows.map((row) => row.launchId));
}

export async function toggleFavorite(
  userId: string,
  launchId: string,
): Promise<{ favorited: boolean } | { error: "not_found" }> {
  const launch = await prisma.launch.findUnique({
    where: { id: launchId },
    select: { id: true },
  });
  if (!launch) {
    return { error: "not_found" };
  }

  const existing = await prisma.favorite.findUnique({
    where: { userId_launchId: { userId, launchId } },
    select: { id: true },
  });
  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return { favorited: false };
  }

  await prisma.favorite.create({ data: { userId, launchId } });
  return { favorited: true };
}

function latestActivityAt(launch: {
  lastSeenAt: Date;
  updatedAt: Date;
  signals: { discoveredAt: Date }[];
  evidences: { capturedAt: Date }[];
}): number {
  return Math.max(
    launch.lastSeenAt.getTime(),
    launch.updatedAt.getTime(),
    ...launch.signals.map((signal) => signal.discoveredAt.getTime()),
    ...launch.evidences.map((evidence) => evidence.capturedAt.getTime()),
  );
}

export async function listMonitoredLaunches(userId: string): Promise<MonitoredLaunchRow[]> {
  const favorites = await prisma.favorite.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { launch: { include: radarLaunchInclude } },
  });
  const volumes = await loadKeywordVolumeIndex();
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  const rows = favorites.map((favorite) => {
    const row = toRadarLaunchRow(favorite.launch, volumes);
    const activity = latestActivityAt(favorite.launch);
    const changedSinceSave = activity > favorite.createdAt.getTime();
    return {
      ...row,
      favoritedAt: favorite.createdAt,
      changedSinceSave,
      changedThisWeek: changedSinceSave && activity >= weekAgo,
    };
  });

  return rows.sort((a, b) => {
    if (a.changedThisWeek !== b.changedThisWeek) {
      return a.changedThisWeek ? -1 : 1;
    }
    if (a.changedSinceSave !== b.changedSinceSave) {
      return a.changedSinceSave ? -1 : 1;
    }
    return b.favoritedAt.getTime() - a.favoritedAt.getTime();
  });
}
