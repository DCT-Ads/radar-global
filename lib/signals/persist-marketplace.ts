import type { Prisma, Signal } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { marketplaceLaunchToSignalPayload } from "@/lib/collectors/marketplace/adapter";
import type { MarketplaceLaunch } from "@/lib/collectors/marketplace/types";
import { enrichSignal } from "@/lib/signals/enrich";
import { keepFilledConfidence, keepFilledString } from "@/lib/signals/filled-fields";
import { loadKeywordVolumeContext } from "@/lib/signals/keyword-volume";

const DIRECTORY_DOMAINS = new Set(["muncheye.com", "www.muncheye.com"]);

export async function persistMarketplaceLaunch(
  item: MarketplaceLaunch,
): Promise<{ signal: Signal | null; created: boolean }> {
  const payload = marketplaceLaunchToSignalPayload(item);
  if (!payload.domain || DIRECTORY_DOMAINS.has(payload.domain)) {
    return { signal: null, created: false };
  }

  const existing = await prisma.signal.findFirst({
    where: {
      OR: [
        { source: payload.source, value: payload.value },
        { source: payload.source, domain: payload.domain },
      ],
    },
    select: { id: true, discoveredAt: true },
  });

  if (existing) {
    return { signal: null, created: false };
  }

  const discoveredAt = new Date();
  const market = await loadKeywordVolumeContext();
  const keyword = keepFilledString(payload.keyword);
  const niche = keepFilledString(payload.niche);
  const keywordVolume = (keyword ? (market.byKeyword[keyword] ?? 0) : 0) + 1;
  const enriched = enrichSignal({
    domain: payload.domain,
    keyword,
    discoveredAt,
    source: payload.source,
    keywordVolume,
    maxKeywordVolume: Math.max(market.maxVolume, keywordVolume),
  });
  const confidence = keepFilledConfidence(enriched.confidence) ?? 0;
  const countryHint = keepFilledString(enriched.countryHint);
  const langHint = keepFilledString(enriched.langHint);
  const enrichedAt =
    confidence > 0 || niche || countryHint ? discoveredAt : undefined;

  try {
    const signal = await prisma.signal.create({
      data: {
        type: payload.type,
        source: payload.source,
        value: payload.value,
        url: payload.url,
        niche,
        keyword,
        domain: payload.domain,
        rawData: payload.rawData as Prisma.InputJsonValue,
        confidence,
        countryHint,
        langHint,
        status: "NEW",
        discoveredAt,
        enrichedAt,
      },
    });
    return { signal, created: true };
  } catch (error) {
    if (
      typeof error === "object" &&
      error &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return { signal: null, created: false };
    }
    throw error;
  }
}
