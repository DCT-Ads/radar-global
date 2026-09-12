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
import { inspectParking, isParked } from "@/lib/signals/anti-parking";
import { syncProbeEvidences } from "@/lib/signals/probe-evidence";
import { verifySignal } from "@/lib/signals/review";

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

  const parking = inspectParking(probe.landing);
  const previous = asJsonObject(signal.rawData);
  const rawData: Prisma.InputJsonObject = {
    ...previous,
    httpProbe: {
      landing: { ...probe.landing, probedAt: probe.landing.probedAt ?? new Date().toISOString() },
      checkout: { ...probe.checkout, probedAt: probe.checkout.probedAt ?? new Date().toISOString() },
      go: { ...probe.go, probedAt: probe.go.probedAt ?? new Date().toISOString() },
      pay: { ...probe.pay, probedAt: probe.pay.probedAt ?? new Date().toISOString() },
    },
    launchPending:
      signal.source === "whoisds" ? !probe.landing.live : previous.launchPending,
    launchAt:
      signal.source === "whoisds" && probe.landing.live
        ? new Date().toISOString()
        : (previous.launchAt ?? null),
    ...(probe.landing.live && parking.parked
      ? {
          antiParking: {
            parked: true,
            reason: parking.reason,
            checkedAt: new Date().toISOString(),
          },
        }
      : {}),
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

  const domain = signal.domain ?? signal.value;
  console.log(
    `[http_probe] ${domain} before-update status=${signal.status} http=${probe.landing.status ?? "none"} live=${probe.landing.live} title=${probe.landing.title ?? "—"}`,
  );

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

  const title = probe.landing.title?.trim() ?? "";
  const shouldVerify =
    probe.landing.live &&
    signal.status !== "VERIFIED" &&
    signal.status !== "DISCARDED" &&
    !isParked(probe.landing);

  console.log(
    `[http_probe] ${domain} after rawData update (status ainda=${signal.status}) critério live=${probe.landing.live} http=${probe.landing.status ?? "none"} titleLen=${title.length}`,
  );

  if (shouldVerify) {
    console.log(`[http_probe] ${domain} calling verifySignal (NEW → VERIFIED)`);
    try {
      const verified = await verifySignal(signalId);
      console.log(`[http_probe] ${domain} after-update status=${verified.status}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`[http_probe] ${domain} after-update FAILED verifySignal: ${message}`);
      throw error;
    }
  } else if (signal.status === "VERIFIED" && signal.launchId && probe.landing.live && !parking.parked) {
    await syncProbeEvidences({
      signalId: signal.id,
      launchId: signal.launchId,
      producerId: signal.producerId,
      rawData,
      confidence: enriched.confidence,
      capturedAt: signal.discoveredAt,
    });
  } else if (probe.landing.live && parking.parked) {
    console.log(`[http_probe] ${domain} SKIP parked/thin (motivo=${parking.reason})`);
  } else {
    console.log(
      `[http_probe] ${domain} after-update status=${signal.status} (não promoveu: live=${probe.landing.live})`,
    );
  }
}

export async function persistLandingReprobe(
  signalId: string,
  landing: ProbePathResult,
) {
  const signal = await prisma.signal.findUnique({ where: { id: signalId } });
  if (!signal) {
    return;
  }
  if (signal.status === "VERIFIED" || signal.status === "DISCARDED") {
    return;
  }

  const parking = inspectParking(landing);
  const previous = asJsonObject(signal.rawData);
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
    launchPending:
      signal.source === "whoisds" ? !landing.live : previous.launchPending,
    launchAt: landing.live
      ? new Date().toISOString()
      : (previous.launchAt ?? null),
    ...(landing.live && parking.parked
      ? {
          antiParking: {
            parked: true,
            reason: parking.reason,
            checkedAt: new Date().toISOString(),
          },
        }
      : {}),
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
