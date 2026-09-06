import type { Signal, SignalStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { enrichProducerById } from "@/lib/producers/enrich";
import { persistLaunchScore } from "@/lib/scoring/persist";
import { ensureSources, getSourceBySlug, SOURCE_SLUGS } from "@/lib/sources";
import { evidenceCreateData, evidenceTypeFromSignal } from "@/lib/signals/evidence";
import { launchIdentityFromSignal } from "@/lib/signals/launch-identity";

export { launchIdentityFromSignal };

const REVIEWABLE: SignalStatus[] = ["NEW", "ENRICHING", "CANDIDATE"];

function sourceSlugFromSignal(source: string) {
  if (source === "crt.sh") {
    return SOURCE_SLUGS.crtsh;
  }
  return source;
}

export async function verifySignal(signalId: string): Promise<Signal> {
  const current = await prisma.signal.findUnique({ where: { id: signalId } });
  if (!current) {
    throw new Error("Signal not found");
  }
  if (current.status === "VERIFIED") {
    return current;
  }
  if (!REVIEWABLE.includes(current.status)) {
    throw new Error(`Signal cannot be verified from ${current.status}`);
  }

  const identity = launchIdentityFromSignal(current);
  if (!identity.producerDomain || !identity.launchDomain) {
    throw new Error("Signal has no domain to verify");
  }

  await ensureSources();
  const catalogSource = await getSourceBySlug(sourceSlugFromSignal(current.source));

  const verified = await prisma.$transaction(async (tx) => {
    const signal = await tx.signal.findUnique({ where: { id: signalId } });
    if (!signal || signal.status === "VERIFIED") {
      return signal ?? current;
    }

    const producer = await tx.producer.upsert({
      where: { domain: identity.producerDomain },
      update: { name: identity.producerName },
      create: {
        name: identity.producerName,
        domain: identity.producerDomain,
        website: identity.website,
      },
    });

    const launch = await tx.launch.upsert({
      where: { domain: identity.launchDomain },
      update: {
        lastSeenAt: new Date(),
        niche: signal.niche,
        title: identity.launchTitle,
      },
      create: {
        producerId: producer.id,
        title: identity.launchTitle,
        slug: identity.launchSlug,
        domain: identity.launchDomain,
        niche: signal.niche,
        firstSeenAt: signal.discoveredAt,
        lastSeenAt: new Date(),
      },
    });

    const url = signal.url ?? `https://crt.sh/?q=${encodeURIComponent(identity.launchDomain)}`;

    await tx.evidence.create({
      data: evidenceCreateData({
        launchId: launch.id,
        producerId: producer.id,
        sourceId: catalogSource.id,
        signalId: signal.id,
        type: evidenceTypeFromSignal(signal.source),
        url,
        title: identity.evidenceTitle,
        snippet: `${signal.source} · ${signal.type} · ${identity.launchDomain}`,
        capturedAt: signal.discoveredAt,
        confidence: signal.confidence,
        raw: {
          source: signal.source,
          collectedAt: signal.discoveredAt.toISOString(),
          keyword: signal.keyword,
          niche: signal.niche,
        },
      }),
    });

    const verified = await tx.signal.update({
      where: { id: signal.id },
      data: {
        status: "VERIFIED",
        producerId: producer.id,
        launchId: launch.id,
        verifiedAt: new Date(),
      },
    });

    // dentro da tx: só persiste o que é rápido
    if (verified.launchId) {
      await persistLaunchScore(verified.launchId, new Date(), tx);
    }

    return verified;
  }, { maxWait: 10_000, timeout: 20_000 });

  if (verified.producerId) {
    await enrichProducerById(verified.producerId);
  }

  return verified;
}

export async function discardSignal(signalId: string): Promise<Signal> {
  const signal = await prisma.signal.findUnique({ where: { id: signalId } });
  if (!signal) {
    throw new Error("Signal not found");
  }
  if (signal.status === "DISCARDED") {
    return signal;
  }
  if (signal.status === "VERIFIED") {
    throw new Error("Verified signals cannot be discarded");
  }

  return prisma.signal.update({
    where: { id: signalId },
    data: { status: "DISCARDED" },
  });
}
