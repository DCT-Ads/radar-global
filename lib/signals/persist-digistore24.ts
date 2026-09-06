import type { Prisma, Signal } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { enrichSignal } from "@/lib/signals/enrich";
import { loadKeywordVolumeContext } from "@/lib/signals/keyword-volume";
import {
  DIGISTORE24_SOURCE,
  type Digistore24Hit,
} from "@/lib/collectors/digistore24";

export async function upsertDigistore24Signal(
  hit: Digistore24Hit,
): Promise<{ signal: Signal; created: boolean }> {
  const existing = await prisma.signal.findUnique({
    where: {
      source_value: { source: DIGISTORE24_SOURCE, value: hit.entryId },
    },
    select: { id: true, discoveredAt: true },
  });

  const discoveredAt = existing?.discoveredAt ?? hit.discoveredAt;
  const market = await loadKeywordVolumeContext();
  const keywordVolume = (market.byKeyword[hit.keyword] ?? 0) + (existing ? 0 : 1);
  const enriched = enrichSignal({
    domain: hit.domain ?? "digistore24.com",
    keyword: hit.keyword,
    discoveredAt,
    source: DIGISTORE24_SOURCE,
    keywordVolume,
    maxKeywordVolume: Math.max(market.maxVolume, keywordVolume),
  });

  const rawData: Prisma.InputJsonValue = {
    entryId: hit.entryId,
    headline: hit.headline,
  };

  const signal = await prisma.signal.upsert({
    where: {
      source_value: { source: DIGISTORE24_SOURCE, value: hit.entryId },
    },
    create: {
      type: "LANDING_PAGE",
      source: DIGISTORE24_SOURCE,
      value: hit.entryId,
      domain: hit.domain,
      niche: hit.niche,
      keyword: hit.keyword,
      url: hit.url,
      rawData,
      confidence: enriched.confidence,
      countryHint: enriched.countryHint,
      langHint: enriched.langHint,
      status: "NEW",
      discoveredAt,
    },
    update: {
      niche: hit.niche,
      keyword: hit.keyword,
      url: hit.url,
      domain: hit.domain,
      rawData,
      confidence: enriched.confidence,
      countryHint: enriched.countryHint,
      langHint: enriched.langHint,
    },
  });

  return { signal, created: !existing };
}
