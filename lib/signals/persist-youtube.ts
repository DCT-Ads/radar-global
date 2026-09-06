import type { Prisma, Signal } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { enrichSignal } from "@/lib/signals/enrich";
import { loadKeywordVolumeContext } from "@/lib/signals/keyword-volume";
import { YOUTUBE_SOURCE, type YoutubeHit } from "@/lib/collectors/youtube";

export async function upsertYoutubeSignal(
  hit: YoutubeHit,
): Promise<{ signal: Signal; created: boolean }> {
  const existing = await prisma.signal.findUnique({
    where: {
      source_value: { source: YOUTUBE_SOURCE, value: hit.videoId },
    },
    select: { id: true, discoveredAt: true },
  });

  const discoveredAt = existing?.discoveredAt ?? hit.publishedAt;
  const market = await loadKeywordVolumeContext();
  const keywordVolume = (market.byKeyword[hit.keyword] ?? 0) + (existing ? 0 : 1);
  const enriched = enrichSignal({
    domain: "youtube.com",
    keyword: hit.keyword,
    discoveredAt,
    source: YOUTUBE_SOURCE,
    keywordVolume,
    maxKeywordVolume: Math.max(market.maxVolume, keywordVolume),
  });

  const rawData: Prisma.InputJsonValue = {
    videoId: hit.videoId,
    title: hit.title,
    channelTitle: hit.channelTitle,
    publishedAt: hit.publishedAt.toISOString(),
  };

  const signal = await prisma.signal.upsert({
    where: {
      source_value: { source: YOUTUBE_SOURCE, value: hit.videoId },
    },
    create: {
      type: "YOUTUBE_VIDEO",
      source: YOUTUBE_SOURCE,
      value: hit.videoId,
      domain: "youtube.com",
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
      rawData,
      confidence: enriched.confidence,
      countryHint: enriched.countryHint,
      langHint: enriched.langHint,
    },
  });

  return { signal, created: !existing };
}
