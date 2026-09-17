import type { Marketplace } from "@prisma/client";
import { ageInDays } from "@/lib/collectors/domains";
import { prisma } from "@/lib/prisma";
import { firstSeenAtFromLaunch } from "@/lib/radar/first-seen";
import { extractProducerContact, type ProducerContact } from "@/lib/producers/contact";
import { enrichProducerById, isProducerEnrichmentDue } from "@/lib/producers/enrich";
import { computeEarlySignal } from "@/lib/scoring/early-signal";
import {
  getSaturationLevel,
  indexKeywordVolumes,
  isUpcomingLaunch,
  landingLiveFromRaw,
} from "@/lib/signals/saturation";

export function formatAffiliateCommission(commission?: {
  commissionPct?: { toString(): string } | number | null;
  amountCents?: number | null;
  currency?: string | null;
  marketplace?: Marketplace | null;
} | null) {
  if (!commission) {
    return null;
  }
  if (commission.commissionPct != null) {
    const pct = Number(commission.commissionPct.toString());
    if (!Number.isNaN(pct)) {
      return `${pct}%`;
    }
  }
  if (commission.amountCents != null) {
    const amount = (commission.amountCents / 100).toFixed(2);
    const currency = commission.currency ?? "USD";
    return `${amount} ${currency}`;
  }
  return null;
}

export async function getRadarLaunch(id: string) {
  const [launch, keywordCounts] = await Promise.all([
    prisma.launch.findUnique({
      where: { id },
      include: {
        producer: { include: { country: true, evidences: true } },
        country: true,
        evidences: {
          include: { source: true },
          orderBy: { capturedAt: "desc" },
        },
        signals: {
          where: { status: "VERIFIED" },
          orderBy: { discoveredAt: "desc" },
        },
        scores: { orderBy: { computedAt: "desc" }, take: 1 },
        commissions: { orderBy: { capturedAt: "desc" }, take: 1 },
      },
    }),
    prisma.signal.groupBy({
      by: ["keyword"],
      _count: { _all: true },
    }),
  ]);

  if (!launch || launch.signals.length === 0) {
    return null;
  }

  if (isProducerEnrichmentDue(launch.producer.enrichedAt)) {
    const enriched = await enrichProducerById(launch.producer.id);
    if (enriched) {
      launch.producer = { ...launch.producer, ...enriched };
    }
  }

  const firstSeenAt = firstSeenAtFromLaunch({
    firstSeenAt: launch.firstSeenAt,
    signals: launch.signals,
  });
  const scored = computeEarlySignal({
    firstSeenAt,
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

  const { byKeyword, median, p75 } = indexKeywordVolumes(keywordCounts);
  const latestSignal = launch.signals[0];
  const keyword = latestSignal?.keyword ?? launch.niche ?? null;
  const saturation = getSaturationLevel({
    keyword,
    keywordVolume: keyword ? (byKeyword[keyword] ?? 1) : 0,
    medianVolume: median,
    p75Volume: p75,
    confidence: latestSignal?.confidence ?? 0,
    firstSeenDaysAgo: ageInDays(firstSeenAt),
  });
  const upcoming = launch.signals.some((signal) =>
    isUpcomingLaunch({
      source: signal.source,
      landingLive: landingLiveFromRaw(signal.rawData),
    }),
  );

  return {
    launch: { ...launch, firstSeenAt },
    scored,
    saturation,
    upcoming,
    keyword,
    contact: contactFromRecords({
      ...launch.producer,
      evidences: [...launch.evidences, ...(launch.producer.evidences ?? [])],
      extras: launch.signals.map((signal) => ({
        url: signal.url,
        raw: signal.rawData,
      })),
    }),
  };
}

export function contactFromRecords(input: {
  email?: string | null;
  instagram?: string | null;
  youtube?: string | null;
  facebook?: string | null;
  linkedin?: string | null;
  x?: string | null;
  telegram?: string | null;
  companyName?: string | null;
  name?: string | null;
  domain?: string | null;
  website?: string | null;
  evidences: Array<{
    url: string;
    title?: string | null;
    snippet?: string | null;
    raw?: unknown;
  }>;
  extras?: Array<{
    url?: string | null;
    title?: string | null;
    snippet?: string | null;
    raw?: unknown;
  }>;
}): ProducerContact {
  return extractProducerContact([
    {
      email: input.email,
      instagram: input.instagram,
      youtube: input.youtube,
      facebook: input.facebook,
      linkedin: input.linkedin,
      x: input.x,
      telegram: input.telegram,
      companyName: input.companyName,
      name: input.name,
      domain: input.domain,
      website: input.website,
    },
    ...input.evidences.map((evidence) => ({
      url: evidence.url,
      title: evidence.title,
      snippet: evidence.snippet,
      raw: evidence.raw,
    })),
    ...(input.extras ?? []),
  ]);
}

export async function getRadarProducer(id: string) {
  const producer = await prisma.producer.findUnique({
    where: { id },
    include: {
      country: true,
      evidences: {
        include: { source: true },
        orderBy: { capturedAt: "desc" },
      },
      launches: {
        where: {
          evidences: { some: {} },
          signals: { some: { status: "VERIFIED" } },
        },
        orderBy: { firstSeenAt: "desc" },
        include: {
          evidences: {
            select: { url: true, title: true, snippet: true, raw: true },
          },
          signals: {
            where: { status: "VERIFIED" },
            select: { url: true, rawData: true, source: true },
          },
        },
      },
    },
  });

  if (!producer) {
    return null;
  }

  const enriched = isProducerEnrichmentDue(producer.enrichedAt)
    ? ((await enrichProducerById(producer.id)) ?? producer)
    : producer;

  return {
    ...producer,
    ...enriched,
    contact: contactFromRecords({
      ...producer,
      ...enriched,
      evidences: [
        ...producer.evidences,
        ...producer.launches.flatMap((launch) => launch.evidences),
      ],
      extras: producer.launches.flatMap((launch) =>
        launch.signals.map((signal) => ({
          url: signal.url,
          raw: signal.rawData,
        })),
      ),
    }),
  };
}
