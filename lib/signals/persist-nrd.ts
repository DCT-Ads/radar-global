import type { Prisma, Signal } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { enrichSignal } from "@/lib/signals/enrich";
import { loadKeywordVolumeContext } from "@/lib/signals/keyword-volume";
import { NRD_SOURCE, type NrdHit } from "@/lib/collectors/nrd";

export async function upsertNrdSignal(
  hit: NrdHit,
): Promise<{ signal: Signal; created: boolean }> {
  const existing = await prisma.signal.findUnique({
    where: {
      source_value: { source: NRD_SOURCE, value: hit.domain },
    },
    select: { id: true, discoveredAt: true },
  });

  const discoveredAt = existing?.discoveredAt ?? hit.registeredAt;
  const market = await loadKeywordVolumeContext();
  const keywordVolume = (market.byKeyword[hit.keyword] ?? 0) + (existing ? 0 : 1);
  const enriched = enrichSignal({
    domain: hit.domain,
    keyword: hit.keyword,
    discoveredAt,
    source: NRD_SOURCE,
    keywordVolume,
    maxKeywordVolume: Math.max(market.maxVolume, keywordVolume),
  });

  const rawData: Prisma.InputJsonValue = {
    registeredAt: hit.registeredAt.toISOString(),
    listDate: hit.listDate,
    launchAt: null,
    launchPending: true,
  };

  const signal = await prisma.signal.upsert({
    where: {
      source_value: { source: NRD_SOURCE, value: hit.domain },
    },
    create: {
      type: "WHOIS_CHANGE",
      source: NRD_SOURCE,
      value: hit.domain,
      domain: hit.domain,
      niche: hit.niche,
      keyword: hit.keyword,
      url: `https://rdap.org/domain/${encodeURIComponent(hit.domain)}`,
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
      rawData,
      confidence: enriched.confidence,
      countryHint: enriched.countryHint,
      langHint: enriched.langHint,
    },
  });

  return { signal, created: !existing };
}
