import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { computeEarlySignal } from "@/lib/scoring/early-signal";

const SCORE_TTL_MS = 6 * 60 * 60 * 1000;

type DbClient = PrismaClient | Prisma.TransactionClient;

export async function loadLaunchScoringInput(launchId: string, db: DbClient = prisma) {
  const launch = await db.launch.findUnique({
    where: { id: launchId },
    include: {
      evidences: {
        include: { source: true },
        orderBy: { capturedAt: "desc" },
      },
      signals: {
        where: { status: "VERIFIED" },
        orderBy: { discoveredAt: "desc" },
      },
    },
  });

  if (!launch) {
    return null;
  }

  return {
    launch,
    input: {
      firstSeenAt: launch.firstSeenAt,
      evidences: launch.evidences.map((evidence) => ({
        capturedAt: evidence.capturedAt,
        url: evidence.url,
        type: evidence.type,
        sourceSlug: evidence.source.slug,
        sourceReliability: evidence.source.reliability,
      })),
      signals: launch.signals.map((signal) => ({
        source: signal.source,
        rawData: signal.rawData,
      })),
    },
  };
}

export async function persistLaunchScore(
  launchId: string,
  now = new Date(),
  db: DbClient = prisma,
) {
  const loaded = await loadLaunchScoringInput(launchId, db);
  if (!loaded) {
    return null;
  }

  const latest = await db.score.findFirst({
    where: { launchId },
    orderBy: { computedAt: "desc" },
  });

  const computed = computeEarlySignal({ ...loaded.input, now });
  if (computed.earlySignal == null && computed.dataQuality == null) {
    return { computed, score: latest, inserted: false };
  }

  const fresh =
    latest && now.getTime() - latest.computedAt.getTime() < SCORE_TTL_MS;
  if (fresh) {
    return { computed, score: latest, inserted: false };
  }

  const score = await db.score.create({
    data: {
      launchId,
      hype: 0,
      opportunity: 0,
      trend: 0,
      competition: 0,
      earlySignal: computed.earlySignal ?? 0,
      dataQuality: computed.dataQuality ?? 0,
      confidence: computed.confidence,
      weightsSnapshot: computed.weightsSnapshot as Prisma.InputJsonValue,
      computedAt: now,
    },
  });

  return { computed, score, inserted: true };
}
