import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { asJsonRecord } from "@/lib/signals/saturation";
import { ensureSources, getSourceBySlug, SOURCE_SLUGS } from "@/lib/sources";
import { evidenceCreateData } from "@/lib/signals/evidence";

type Db = Prisma.TransactionClient | typeof prisma;

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

export async function syncProbeEvidences(
  input: {
    signalId: string;
    launchId: string;
    producerId: string | null;
    rawData: unknown;
    confidence: number;
    capturedAt: Date;
    sourceId?: string;
  },
  db: Db = prisma,
) {
  const sourceId = input.sourceId ?? (await getHttpProbeSourceId());
  let created = 0;

  for (const path of PROBE_PATHS) {
    const live = livePath(input.rawData, path.key);
    if (!live) {
      continue;
    }

    const existing = await db.evidence.findFirst({
      where: {
        url: live.url,
        type: "LANDING_PAGE",
        OR: [{ signalId: input.signalId }, { launchId: input.launchId }],
      },
      select: { id: true },
    });
    if (existing) {
      continue;
    }

    await db.evidence.create({
      data: evidenceCreateData({
        launchId: input.launchId,
        producerId: input.producerId,
        sourceId,
        signalId: input.signalId,
        type: "LANDING_PAGE",
        url: live.url,
        title: live.title ?? path.title,
        snippet: `http_probe · ${path.key} · live`,
        capturedAt: live.probedAt ?? input.capturedAt,
        confidence: input.confidence,
        raw: {
          source: SOURCE_SLUGS.httpProbe,
          path: path.key,
          collectedAt: (live.probedAt ?? input.capturedAt).toISOString(),
        },
      }),
    });
    created += 1;
  }

  return created;
}

let cachedHttpProbeSourceId: string | null = null;

export async function getHttpProbeSourceId() {
  if (cachedHttpProbeSourceId) {
    return cachedHttpProbeSourceId;
  }
  await ensureSources();
  const source = await getSourceBySlug(SOURCE_SLUGS.httpProbe);
  cachedHttpProbeSourceId = source.id;
  return source.id;
}
