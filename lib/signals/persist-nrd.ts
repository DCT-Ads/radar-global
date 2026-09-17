import type { Prisma, Signal } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { enrichSignal } from "@/lib/signals/enrich";
import { keepFilledConfidence, keepFilledString } from "@/lib/signals/filled-fields";
import { loadKeywordVolumeContext } from "@/lib/signals/keyword-volume";
import {
  fetchRdapRegisteredAt,
  resolveSignalTimelineDates,
  trustedRegisteredAtFromRaw,
} from "@/lib/signals/whois-registered-at";
import { NRD_SOURCE, type NrdHit } from "@/lib/collectors/nrd";

export type UpsertNrdOptions = {
  now?: Date;
  lookupRegisteredAt?: (domain: string) => Promise<Date | null>;
};

function asJsonObject(value: Prisma.JsonValue | null | undefined): Prisma.InputJsonObject {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return { ...value };
  }
  return {};
}

export async function upsertNrdSignal(
  hit: NrdHit,
  options: UpsertNrdOptions = {},
): Promise<{ signal: Signal; created: boolean }> {
  const existing = await prisma.signal.findUnique({
    where: {
      source_value: { source: NRD_SOURCE, value: hit.domain },
    },
    select: {
      id: true,
      discoveredAt: true,
      rawData: true,
      niche: true,
      keyword: true,
      confidence: true,
      countryHint: true,
      langHint: true,
      enrichedAt: true,
    },
  });

  const lookup = options.lookupRegisteredAt ?? fetchRdapRegisteredAt;
  const existingRegistered = trustedRegisteredAtFromRaw(existing?.rawData);
  const whoisRegisteredAt =
    existingRegistered ??
    hit.registeredAt ??
    (existing ? null : await lookup(hit.domain));
  const { discoveredAt, registeredAt } = resolveSignalTimelineDates({
    existingDiscoveredAt: existing?.discoveredAt,
    existingRegisteredAt: existingRegistered,
    whoisRegisteredAt,
    listDate: hit.listDate,
    now: options.now,
  });

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

  const previous = asJsonObject(existing?.rawData);
  const rawData: Prisma.InputJsonValue = {
    ...previous,
    listDate: hit.listDate,
    registeredAt: registeredAt?.toISOString() ?? null,
    launchAt: previous.launchAt ?? null,
    launchPending: previous.launchPending ?? true,
  };

  const niche = keepFilledString(hit.niche);
  const keyword = keepFilledString(hit.keyword);
  const countryHint = keepFilledString(enriched.countryHint);
  const langHint = keepFilledString(enriched.langHint);
  const confidence = keepFilledConfidence(enriched.confidence);

  const signal = await prisma.signal.upsert({
    where: {
      source_value: { source: NRD_SOURCE, value: hit.domain },
    },
    create: {
      type: "WHOIS_CHANGE",
      source: NRD_SOURCE,
      value: hit.domain,
      domain: hit.domain,
      niche: niche ?? hit.niche,
      keyword: keyword ?? hit.keyword,
      url: `https://rdap.org/domain/${encodeURIComponent(hit.domain)}`,
      rawData,
      confidence: confidence ?? 0,
      countryHint,
      langHint,
      status: "NEW",
      discoveredAt,
    },
    update: {
      rawData,
      ...(niche ? { niche } : {}),
      ...(keyword ? { keyword } : {}),
      ...(confidence ? { confidence } : {}),
      ...(countryHint ? { countryHint } : {}),
      ...(langHint ? { langHint } : {}),
    },
  });

  return { signal, created: !existing };
}
