import type { Prisma, SignalStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { NRD_SOURCE } from "@/lib/collectors/nrd";
import { persistLandingReprobe } from "@/lib/collectors/persist";
import { probeLanding } from "@/lib/collectors/http-probe";
import { getSourceBySlug, SOURCE_SLUGS } from "@/lib/sources";

const REVIEWABLE: SignalStatus[] = ["NEW", "ENRICHING", "CANDIDATE"];
const STALE_AFTER_MS = 8 * 60 * 60 * 1000;

export type ReprobeResult = {
  probed: number;
  wentLive: number;
  pendingLeft: number;
  skipped: number;
  errors: string[];
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function asRecord(value: Prisma.JsonValue | null): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

export function reprobeLimits(kind: "worker" | "cron" | "inline") {
  const maxDefault = kind === "cron" ? 25 : kind === "inline" ? 40 : 80;
  const maxPerRun = Number(process.env.REPROBE_MAX_PER_RUN ?? maxDefault);
  const gapMs = Number(process.env.REPROBE_GAP_MS ?? 600);
  return {
    maxPerRun: Math.min(200, Math.max(1, maxPerRun)),
    gapMs: Math.min(5_000, Math.max(200, gapMs)),
  };
}

export async function countPendingNrdReprobes() {
  return prisma.signal.count({
    where: {
      source: NRD_SOURCE,
      status: { in: REVIEWABLE },
      rawData: { path: ["launchPending"], equals: true },
    },
  });
}

export async function getReprobeHealth() {
  const source = await getSourceBySlug(SOURCE_SLUGS.httpProbe);
  const config = asRecord(source.config);
  const lastReprobeAtRaw =
    typeof config?.lastReprobeAt === "string" ? config.lastReprobeAt : null;
  const lastReprobeAt = lastReprobeAtRaw ? new Date(lastReprobeAtRaw) : null;
  const pendingCount = await countPendingNrdReprobes();
  const stale =
    pendingCount > 0 &&
    (!lastReprobeAt || Date.now() - lastReprobeAt.getTime() > STALE_AFTER_MS);

  return {
    lastReprobeAt,
    pendingCount,
    stale,
  };
}

async function markReprobeHeartbeat(result: ReprobeResult) {
  const source = await getSourceBySlug(SOURCE_SLUGS.httpProbe);
  const config = asRecord(source.config) ?? {};
  await prisma.source.update({
    where: { slug: SOURCE_SLUGS.httpProbe },
    data: {
      lastRunAt: new Date(),
      lastError: result.errors[0] ?? null,
      status: result.errors.length && result.probed === 0 ? "ERROR" : "ACTIVE",
      config: {
        ...config,
        lastReprobeAt: new Date().toISOString(),
        lastReprobeProbed: result.probed,
        lastReprobeWentLive: result.wentLive,
        lastReprobePendingLeft: result.pendingLeft,
      },
    },
  });
}

export async function runPendingNrdReprobe(
  kind: "worker" | "cron" | "inline" = "worker",
): Promise<ReprobeResult> {
  const { maxPerRun, gapMs } = reprobeLimits(kind);
  const errors: string[] = [];
  const candidates = await prisma.signal.findMany({
    where: {
      source: NRD_SOURCE,
      status: { in: REVIEWABLE },
      rawData: { path: ["launchPending"], equals: true },
    },
    orderBy: { updatedAt: "asc" },
    take: maxPerRun,
    select: {
      id: true,
      source: true,
      status: true,
      domain: true,
      value: true,
    },
  });

  let probed = 0;
  let wentLive = 0;
  let skipped = 0;

  for (const signal of candidates) {
    if (
      signal.source !== NRD_SOURCE ||
      signal.status === "VERIFIED" ||
      signal.status === "DISCARDED"
    ) {
      skipped += 1;
      continue;
    }

    const domain = signal.domain ?? signal.value;
    try {
      const landing = await probeLanding(domain);
      await persistLandingReprobe(signal.id, landing);
      probed += 1;
      if (landing.live) {
        wentLive += 1;
      }
    } catch (error) {
      errors.push(
        `reprobe ${domain}: ${error instanceof Error ? error.message : "unknown error"}`,
      );
    }
    await sleep(gapMs);
  }

  const pendingLeft = await countPendingNrdReprobes();
  const result: ReprobeResult = {
    probed,
    wentLive,
    pendingLeft,
    skipped,
    errors,
  };
  await markReprobeHeartbeat(result);
  return result;
}
