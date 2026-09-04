import type { Lifecycle, Prisma, SignalType, Source } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { DiscoveredDomain } from "./crtsh";
import { domainSlug } from "./domains";
import type { HttpProbeResult, ProbePathResult } from "./http-probe";

const SIGNAL_DEDUP_HOURS = 24;

async function recordSignal(input: {
  launchId: string;
  sourceId: string;
  type: SignalType;
  value?: number;
  payload?: Prisma.InputJsonValue;
  url: string;
  title: string;
  snippet: string;
  raw?: Prisma.InputJsonValue;
}) {
  const since = new Date(Date.now() - SIGNAL_DEDUP_HOURS * 60 * 60 * 1000);
  const existing = await prisma.signal.findFirst({
    where: {
      launchId: input.launchId,
      sourceId: input.sourceId,
      type: input.type,
      observedAt: { gte: since },
    },
  });
  if (existing) {
    return existing;
  }

  return prisma.signal.create({
    data: {
      launchId: input.launchId,
      sourceId: input.sourceId,
      type: input.type,
      value: input.value,
      payload: input.payload,
      evidences: {
        create: {
          launchId: input.launchId,
          sourceId: input.sourceId,
          url: input.url,
          title: input.title,
          snippet: input.snippet,
          raw: input.raw,
        },
      },
    },
  });
}

export async function persistDiscoveredDomain(
  discovered: DiscoveredDomain,
  crtshSource: Source,
) {
  const producer = await prisma.producer.upsert({
    where: { domain: discovered.domain },
    update: { name: discovered.domain },
    create: {
      name: discovered.domain,
      domain: discovered.domain,
      website: `https://${discovered.domain}`,
    },
  });

  const launch = await prisma.launch.upsert({
    where: { domain: discovered.domain },
    update: {
      lastSeenAt: new Date(),
      niche: discovered.keyword,
    },
    create: {
      producerId: producer.id,
      title: discovered.domain,
      slug: domainSlug(discovered.domain),
      domain: discovered.domain,
      niche: discovered.keyword,
      firstSeenAt: discovered.firstSeenAt,
      lastSeenAt: new Date(),
    },
  });

  await recordSignal({
    launchId: launch.id,
    sourceId: crtshSource.id,
    type: "NEW_DOMAIN",
    value: Number(discovered.ageDays.toFixed(2)),
    payload: {
      keyword: discovered.keyword,
      certIds: discovered.certIds,
      ageDays: discovered.ageDays,
    },
    url: discovered.evidenceUrl,
    title: "Certificate Transparency",
    snippet: `Public CT certificate for ${discovered.domain} issued ${discovered.firstSeenAt.toISOString()}`,
    raw: { certIds: discovered.certIds, notBefore: discovered.firstSeenAt.toISOString() },
  });

  await recordSignal({
    launchId: launch.id,
    sourceId: crtshSource.id,
    type: "SSL_ISSUED",
    value: 1,
    url: discovered.evidenceUrl,
    title: "SSL issued",
    snippet: `Public certificate observed for ${discovered.domain}`,
    raw: { certIds: discovered.certIds },
  });

  if (discovered.hasCheckoutSubdomain) {
    await recordSignal({
      launchId: launch.id,
      sourceId: crtshSource.id,
      type: "SUBDOMAIN_CHECKOUT",
      value: 1,
      url: discovered.evidenceUrl,
      title: "Checkout-like subdomain",
      snippet: `CT names for ${discovered.domain} include checkout/go/pay`,
    });
  }

  return launch;
}

function lifecycleFromProbe(
  current: Lifecycle,
  probe: HttpProbeResult,
): Lifecycle {
  if (probe.landing.live && (probe.checkout.live || probe.go.live || probe.pay.live)) {
    return current === "DISCOVERY" ? "PRE_LAUNCH" : current;
  }
  return current;
}

async function recordPathSignal(
  launchId: string,
  sourceId: string,
  result: ProbePathResult,
  type: SignalType,
  title: string,
) {
  if (!result.live) {
    return;
  }
  await recordSignal({
    launchId,
    sourceId,
    type,
    value: 1,
    payload: { path: result.path, status: result.status },
    url: result.url,
    title,
    snippet: `HTTP ${result.status ?? "n/a"} at ${result.url}`,
    raw: { status: result.status, path: result.path },
  });
}

export async function persistHttpProbe(
  launchId: string,
  probe: HttpProbeResult,
  httpSource: Source,
) {
  const launch = await prisma.launch.findUniqueOrThrow({
    where: { id: launchId },
  });

  const nextTitle =
    launch.title === launch.domain && probe.landing.title
      ? probe.landing.title
      : launch.title;

  await prisma.launch.update({
    where: { id: launchId },
    data: {
      title: nextTitle,
      landingLive: probe.landing.live,
      hasCheckout: probe.checkout.live,
      hasGoPath: probe.go.live,
      hasPayPath: probe.pay.live,
      lastProbedAt: new Date(),
      lastSeenAt: new Date(),
      lifecycle: lifecycleFromProbe(launch.lifecycle, probe),
    },
  });

  if (probe.landing.live) {
    await recordPathSignal(launchId, httpSource.id, probe.landing, "LANDING_LIVE", "Landing live");
  }
  if (probe.checkout.live || probe.go.live || probe.pay.live) {
    const livePath = [probe.checkout, probe.go, probe.pay].find((item) => item.live);
    if (livePath) {
      await recordPathSignal(
        launchId,
        httpSource.id,
        livePath,
        "SUBDOMAIN_CHECKOUT",
        "Checkout path live",
      );
    }
  }
}
