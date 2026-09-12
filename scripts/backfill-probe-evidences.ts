import { prisma } from "../lib/prisma";
import { firstSeenAtFromLaunch } from "../lib/radar/first-seen";
import { asJsonRecord } from "../lib/signals/saturation";
import { getHttpProbeSourceId } from "../lib/signals/probe-evidence";
import { evidenceCreateData } from "../lib/signals/evidence";

const PROBE_PATHS = [
  { key: "landing", title: "Landing live" },
  { key: "checkout", title: "Checkout path live" },
  { key: "go", title: "Go path live" },
  { key: "pay", title: "Pay path live" },
] as const;

function livePath(raw: unknown, key: string) {
  const probe = asJsonRecord(asJsonRecord(raw)?.httpProbe);
  const path = asJsonRecord(probe?.[key]);
  if (path?.live !== true || typeof path.url !== "string" || !path.url.trim()) {
    return null;
  }
  const probedAt =
    typeof path.probedAt === "string" && !Number.isNaN(Date.parse(path.probedAt))
      ? new Date(path.probedAt)
      : null;
  const title =
    key === "landing" && typeof path.title === "string" && path.title.trim()
      ? path.title.trim().slice(0, 160)
      : null;
  return { url: path.url.trim(), probedAt, title };
}

async function main() {
  const sourceId = await getHttpProbeSourceId();
  const launches = await prisma.launch.findMany({
    where: { signals: { some: { status: "VERIFIED" } } },
    select: {
      id: true,
      firstSeenAt: true,
      signals: {
        where: { status: "VERIFIED" },
        select: {
          id: true,
          producerId: true,
          rawData: true,
          confidence: true,
          discoveredAt: true,
        },
      },
      evidences: {
        where: { type: "LANDING_PAGE" },
        select: { url: true },
      },
    },
  });

  const existing = new Set(
    launches.flatMap((launch) => launch.evidences.map((evidence) => `${launch.id}::${evidence.url}`)),
  );
  const toCreate: ReturnType<typeof evidenceCreateData>[] = [];
  const firstSeenUpdates: Array<{ id: string; firstSeenAt: Date }> = [];

  for (const launch of launches) {
    const nextFirstSeen = firstSeenAtFromLaunch({
      firstSeenAt: launch.firstSeenAt,
      signals: launch.signals,
    });
    if (nextFirstSeen.getTime() !== launch.firstSeenAt.getTime()) {
      firstSeenUpdates.push({ id: launch.id, firstSeenAt: nextFirstSeen });
    }

    for (const signal of launch.signals) {
      for (const path of PROBE_PATHS) {
        const live = livePath(signal.rawData, path.key);
        if (!live) {
          continue;
        }
        const key = `${launch.id}::${live.url}`;
        if (existing.has(key)) {
          continue;
        }
        existing.add(key);
        toCreate.push(
          evidenceCreateData({
            launchId: launch.id,
            producerId: signal.producerId,
            sourceId,
            signalId: signal.id,
            type: "LANDING_PAGE",
            url: live.url,
            title: live.title ?? path.title,
            snippet: `http_probe · ${path.key} · live`,
            capturedAt: live.probedAt ?? signal.discoveredAt,
            confidence: signal.confidence,
            raw: {
              source: "http_probe",
              path: path.key,
              collectedAt: (live.probedAt ?? signal.discoveredAt).toISOString(),
            },
          }),
        );
      }
    }
  }

  const created =
    toCreate.length > 0
      ? (await prisma.evidence.createMany({ data: toCreate })).count
      : 0;

  for (const update of firstSeenUpdates) {
    await prisma.launch.update({
      where: { id: update.id },
      data: { firstSeenAt: update.firstSeenAt },
    });
  }

  console.log(
    JSON.stringify({
      launches: launches.length,
      firstSeenUpdated: firstSeenUpdates.length,
      evidenceCreated: created,
    }),
  );
  await prisma.$disconnect();
}

main();
