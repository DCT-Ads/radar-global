import type { Prisma, Signal } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { enrichSignal } from "@/lib/signals/enrich";
import { loadKeywordVolumeContext } from "@/lib/signals/keyword-volume";

export const CRTSH_SOURCE = "crt.sh";

export type CrtshSignalInput = {
  domain: string;
  niche: string;
  keyword: string;
  issuedAt: Date | null;
  url?: string;
  rawData?: Prisma.InputJsonValue;
  confidence?: number;
};

export async function upsertCrtshSignal(
  input: CrtshSignalInput,
): Promise<{ signal: Signal; created: boolean }> {
  const existing = await prisma.signal.findUnique({
    where: {
      source_value: { source: CRTSH_SOURCE, value: input.domain },
    },
    select: { id: true, discoveredAt: true },
  });

  const url =
    input.url ?? `https://crt.sh/?q=${encodeURIComponent(input.domain)}`;
  const rawData = input.rawData ?? {
    issuedAt: input.issuedAt?.toISOString() ?? null,
  };
  const discoveredAt = existing?.discoveredAt ?? input.issuedAt ?? new Date();
  const market = await loadKeywordVolumeContext();
  const keywordVolume = (market.byKeyword[input.keyword] ?? 0) + (existing ? 0 : 1);
  const enriched = enrichSignal({
    domain: input.domain,
    keyword: input.keyword,
    discoveredAt,
    source: CRTSH_SOURCE,
    keywordVolume,
    maxKeywordVolume: Math.max(market.maxVolume, keywordVolume),
  });

  const signal = await prisma.signal.upsert({
    where: {
      source_value: { source: CRTSH_SOURCE, value: input.domain },
    },
    create: {
      type: "NEW_DOMAIN",
      source: CRTSH_SOURCE,
      value: input.domain,
      domain: input.domain,
      niche: input.niche,
      keyword: input.keyword,
      url,
      rawData,
      confidence: input.confidence ?? enriched.confidence,
      countryHint: enriched.countryHint,
      langHint: enriched.langHint,
      status: "NEW",
      discoveredAt,
    },
    update: {
      niche: input.niche,
      keyword: input.keyword,
      url,
      rawData,
      confidence: input.confidence ?? enriched.confidence,
      countryHint: enriched.countryHint,
      langHint: enriched.langHint,
    },
  });

  return { signal, created: !existing };
}
