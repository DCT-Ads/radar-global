import type { Prisma, SignalStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { NRD_SOURCE } from "@/lib/collectors/nrd";
import { CRTSH_SOURCE } from "@/lib/signals/persist-crtsh";
import { persistLandingReprobe } from "@/lib/collectors/persist";
import { probeLanding, type ProbePathResult } from "@/lib/collectors/http-probe";
import { getSourceBySlug, SOURCE_SLUGS } from "@/lib/sources";
import { inspectParking } from "@/lib/signals/anti-parking";
import { verifySignal } from "@/lib/signals/review";

const REVIEWABLE: SignalStatus[] = ["NEW", "ENRICHING", "CANDIDATE"];
const STALE_AFTER_MS = 8 * 60 * 60 * 1000;
const PROMOTE_SOURCES = [NRD_SOURCE, CRTSH_SOURCE] as const;

export type ReprobeResult = {
  probed: number;
  wentLive: number;
  promoted: number;
  parked: number;
  pendingLeft: number;
  skipped: number;
  errors: string[];
};

export type ReprobeRunOptions = {
  dryRun?: boolean;
  force?: boolean;
  maxPerRun?: number;
  alreadyLive?: boolean;
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
        lastReprobePromoted: result.promoted,
        lastReprobePendingLeft: result.pendingLeft,
      },
    },
  });
}

function promotionDecision(landing: ProbePathResult, force: boolean) {
  if (!landing.live) {
    return {
      promote: false,
      reason: `REJECTED http=${landing.status ?? "none"} live=false`,
    };
  }
  if (!force) {
    const parking = inspectParking(landing);
    if (parking.parked) {
      return {
        promote: false,
        reason: `SKIP parked/thin (motivo=${parking.reason})`,
      };
    }
  }
  const title = landing.title?.trim() ?? "";
  return {
    promote: true,
    reason: `PROMOTED http=${landing.status} live=true title=${JSON.stringify(title.slice(0, 80) || "—")}`,
  };
}

export async function runPendingNrdReprobe(
  kind: "worker" | "cron" | "inline" = "worker",
  options: ReprobeRunOptions = {},
): Promise<ReprobeResult> {
  const limits = reprobeLimits(kind);
  const maxPerRun = options.maxPerRun ?? limits.maxPerRun;
  const { gapMs } = limits;
  const dryRun = Boolean(options.dryRun);
  const force = Boolean(options.force);
  const errors: string[] = [];

  const candidates = await prisma.signal.findMany({
    where: {
      source: { in: [...PROMOTE_SOURCES] },
      status: { in: REVIEWABLE },
      rawData: { path: ["launchPending"], equals: true },
      ...(options.alreadyLive
        ? { AND: [{ rawData: { path: ["httpProbe", "landing", "live"], equals: true } }] }
        : {}),
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
  let promoted = 0;
  let parked = 0;
  let skipped = 0;

  for (const signal of candidates) {
    if (signal.status === "VERIFIED" || signal.status === "DISCARDED") {
      skipped += 1;
      console.log(`[reprobe] skip ${signal.domain ?? signal.value} status=${signal.status}`);
      continue;
    }

    const domain = signal.domain ?? signal.value;
    try {
      const landing = await probeLanding(domain);
      probed += 1;
      if (landing.live) {
        wentLive += 1;
      }
      const decision = promotionDecision(landing, force);
      if (!decision.promote && decision.reason.startsWith("SKIP parked")) {
        parked += 1;
        console.log(`[http_probe] ${domain} ${decision.reason}`);
      }
      console.log(
        `[reprobe] ${domain} source=${signal.source} http=${landing.status ?? "none"} live=${landing.live} title=${landing.title ?? "—"} → ${decision.reason}`,
      );

      if (dryRun) {
        continue;
      }

      await persistLandingReprobe(signal.id, landing);
      if (decision.promote) {
        console.log(`[http_probe] ${domain} calling verifySignal (NEW → VERIFIED)`);
        const verified = await verifySignal(signal.id);
        console.log(`[http_probe] ${domain} after-update status=${verified.status}`);
        promoted += 1;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error";
      errors.push(`reprobe ${domain}: ${message}`);
      console.log(`[reprobe] ${domain} → REJECTED ${message}`);
    }
    await sleep(gapMs);
  }

  const pendingLeft = await countPendingNrdReprobes();
  const result: ReprobeResult = {
    probed,
    wentLive,
    promoted,
    parked,
    pendingLeft,
    skipped,
    errors,
  };
  if (!dryRun) {
    await markReprobeHeartbeat(result);
  }
  return result;
}
