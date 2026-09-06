import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { DiscoveredDomain } from "./crtsh";
import {
  pageLocaleFromProbe,
  type HttpProbeResult,
  type ProbePathResult,
} from "./http-probe";
import { upsertCrtshSignal } from "@/lib/signals/persist-crtsh";
import { enrichSignal } from "@/lib/signals/enrich";
import { loadKeywordVolumeContext } from "@/lib/signals/keyword-volume";

function asJsonObject(value: Prisma.JsonValue | null): Prisma.InputJsonObject {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return { ...value };
  }
  return {};
}

export async function persistDiscoveredDomain(discovered: DiscoveredDomain) {
  return upsertCrtshSignal({
    domain: discovered.domain,
    niche: discovered.keyword,
    keyword: discovered.keyword,
    issuedAt: discovered.firstSeenAt,
    url: discovered.evidenceUrl,
    rawData: {
      issuedAt: discovered.firstSeenAt.toISOString(),
      certIds: discovered.certIds,
      ageDays: discovered.ageDays,
      hasCheckoutSubdomain: discovered.hasCheckoutSubdomain,
    },
  });
}

export async function persistHttpProbe(signalId: string, probe: HttpProbeResult) {
  const signal = await prisma.signal.findUnique({ where: { id: signalId } });
  if (!signal) {
    return;
  }

  const previous = asJsonObject(signal.rawData);
  const rawData: Prisma.InputJsonObject = {
    ...previous,
    httpProbe: {
      landing: probe.landing,
      checkout: probe.checkout,
      go: probe.go,
      pay: probe.pay,
    },
    launchPending:
      signal.source === "whoisds" ? !probe.landing.live : previous.launchPending,
    launchAt:
      signal.source === "whoisds" && probe.landing.live
        ? new Date().toISOString()
        : (previous.launchAt ?? null),
  };

  const market = await loadKeywordVolumeContext();
  const keywordVolume = signal.keyword
    ? (market.byKeyword[signal.keyword] ?? 1)
    : 1;
  const enriched = enrichSignal({
    domain: signal.domain ?? signal.value,
    keyword: signal.keyword,
    discoveredAt: signal.discoveredAt,
    source: signal.source,
    landingLive: probe.landing.live,
    pageLocale: pageLocaleFromProbe(probe.landing),
    keywordVolume,
    maxKeywordVolume: market.maxVolume,
  });

  await prisma.signal.update({
    where: { id: signalId },
    data: {
      rawData,
      url: probe.landing.live ? probe.landing.url : signal.url,
      confidence: enriched.confidence,
      countryHint: enriched.countryHint,
      langHint: enriched.langHint,
    },
  });
}

export async function persistLandingReprobe(
  signalId: string,
  landing: ProbePathResult,
) {
  const signal = await prisma.signal.findUnique({ where: { id: signalId } });
  if (!signal || signal.source !== "whoisds") {
    return;
  }
  if (signal.status === "VERIFIED" || signal.status === "DISCARDED") {
    return;
  }

  const previous = asJsonObject(signal.rawData);
  if (previous.launchPending !== true) {
    return;
  }

  const previousProbe = asJsonObject(
    previous.httpProbe && typeof previous.httpProbe === "object" && !Array.isArray(previous.httpProbe)
      ? (previous.httpProbe as Prisma.JsonObject)
      : null,
  );

  const rawData: Prisma.InputJsonObject = {
    ...previous,
    httpProbe: {
      ...previousProbe,
      landing,
    },
    launchPending: !landing.live,
    launchAt: landing.live ? new Date().toISOString() : (previous.launchAt ?? null),
  };

  const market = await loadKeywordVolumeContext();
  const keywordVolume = signal.keyword
    ? (market.byKeyword[signal.keyword] ?? 1)
    : 1;
  const enriched = enrichSignal({
    domain: signal.domain ?? signal.value,
    keyword: signal.keyword,
    discoveredAt: signal.discoveredAt,
    source: signal.source,
    landingLive: landing.live,
    pageLocale: pageLocaleFromProbe(landing),
    keywordVolume,
    maxKeywordVolume: market.maxVolume,
  });

  await prisma.signal.update({
    where: { id: signal.id },
    data: {
      rawData,
      url: landing.live ? landing.url : signal.url,
      confidence: enriched.confidence,
      countryHint: enriched.countryHint,
      langHint: enriched.langHint,
    },
  });
}
