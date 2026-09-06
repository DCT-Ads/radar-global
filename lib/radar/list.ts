import { ageInDays } from "@/lib/collectors/domains";
import { prisma } from "@/lib/prisma";
import { computeEarlySignal, goldenWindowRank } from "@/lib/scoring/early-signal";
import {
  getSaturationLevel,
  indexKeywordVolumes,
  isUpcomingLaunch,
  landingLiveFromRaw,
  type SaturationLevel,
} from "@/lib/signals/saturation";

export type RadarLaunchRow = {
  id: string;
  title: string;
  domain: string;
  niche: string | null;
  firstSeenAt: Date;
  producer: { id: string; name: string; domain: string };
  earlySignal: number | null;
  dataQuality: number | null;
  confidence: "LOW" | "MED" | "HIGH";
  saturation: SaturationLevel;
  upcoming: boolean;
  keyword: string | null;
  evidenceCount: number;
  goldenWindow: number;
};

export async function listVerifiedRadarLaunches(): Promise<RadarLaunchRow[]> {
  const [launches, keywordCounts] = await Promise.all([
    prisma.launch.findMany({
      where: {
        evidences: { some: {} },
        signals: { some: { status: "VERIFIED" } },
      },
      include: {
        producer: { select: { id: true, name: true, domain: true } },
        evidences: {
          include: { source: true },
          orderBy: { capturedAt: "desc" },
        },
        signals: {
          where: { status: "VERIFIED" },
          orderBy: { discoveredAt: "desc" },
        },
      },
    }),
    prisma.signal.groupBy({
      by: ["keyword"],
      _count: { _all: true },
    }),
  ]);

  const { byKeyword, median, p75 } = indexKeywordVolumes(keywordCounts);

  const rows = launches.map((launch) => {
    const scored = computeEarlySignal({
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
    });

    const latestSignal = launch.signals[0];
    const keyword = latestSignal?.keyword ?? launch.niche ?? null;
    const saturation = getSaturationLevel({
      keywordVolume: keyword ? (byKeyword[keyword] ?? 1) : 1,
      medianVolume: median,
      p75Volume: p75,
      confidence: latestSignal?.confidence ?? 0,
      firstSeenDaysAgo: ageInDays(launch.firstSeenAt),
    });
    const upcoming = launch.signals.some((signal) =>
      isUpcomingLaunch({
        source: signal.source,
        landingLive: landingLiveFromRaw(signal.rawData),
      }),
    );
    const daysAgo = ageInDays(launch.firstSeenAt);

    return {
      id: launch.id,
      title: launch.title,
      domain: launch.domain,
      niche: launch.niche,
      firstSeenAt: launch.firstSeenAt,
      producer: launch.producer,
      earlySignal: scored.earlySignal,
      dataQuality: scored.dataQuality,
      confidence: scored.confidence,
      saturation,
      upcoming,
      keyword,
      evidenceCount: launch.evidences.length,
      goldenWindow: goldenWindowRank(scored.earlySignal, saturation, daysAgo),
    };
  });

  return rows.sort((a, b) => b.goldenWindow - a.goldenWindow);
}
