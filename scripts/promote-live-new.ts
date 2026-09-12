import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { persistLandingReprobe } from "../lib/collectors/persist";
import { probeLanding } from "../lib/collectors/http-probe";
import { inspectParking, isParked, type ParkingLanding } from "../lib/signals/anti-parking";
import { verifySignal } from "../lib/signals/review";

const BATCH_SIZE = 100;
const REVIEWABLE = ["NEW", "ENRICHING", "CANDIDATE"] as const;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function landingFromRaw(rawData: Prisma.JsonValue | null): ParkingLanding & { live?: boolean } {
  const raw = asRecord(rawData);
  const landing = asRecord(asRecord(raw?.httpProbe)?.landing);
  const text = (key: string) => {
    const value = landing?.[key];
    return typeof value === "string" ? value : null;
  };
  return {
    live: landing?.live === true,
    title: text("title"),
    bodySnippet: text("bodySnippet") ?? text("body"),
  };
}

function reviewableWhere(afterId?: string): Prisma.SignalWhereInput {
  return {
    status: { in: [...REVIEWABLE] },
    source: { in: ["crt.sh", "whoisds"] },
    ...(afterId ? { id: { gt: afterId } } : {}),
  };
}

async function main() {
  const force = process.argv.includes("--force");
  let total = 0;
  let promovidos = 0;
  let skip_parked = 0;
  let skip_notlive = 0;
  let falhas = 0;
  let cursorId: string | undefined;
  let batchIndex = 0;

  const queued = await prisma.signal.count({ where: reviewableWhere() });
  console.log(
    `[promote] ${queued} reviewable · lotes de ${BATCH_SIZE} · force=${force}`,
  );

  while (true) {
    const batch = await prisma.signal.findMany({
      where: reviewableWhere(cursorId),
      orderBy: { id: "asc" },
      take: BATCH_SIZE,
      select: {
        id: true,
        domain: true,
        value: true,
        source: true,
        status: true,
        rawData: true,
      },
    });

    if (batch.length === 0) {
      break;
    }

    batchIndex += 1;
    console.log(
      `[promote] lote ${batchIndex} size=${batch.length} afterId=${cursorId ?? "start"}`,
    );

    for (const signal of batch) {
      const domain = signal.domain ?? signal.value;
      total += 1;
      try {
        let landing = landingFromRaw(signal.rawData);
        if (landing.live === true && !landing.bodySnippet) {
          const probed = await probeLanding(domain);
          await persistLandingReprobe(signal.id, probed);
          landing = {
            live: probed.live,
            title: probed.title,
            bodySnippet: probed.bodySnippet,
          };
        }

        if (landing.live !== true) {
          skip_notlive += 1;
          continue;
        }

        const parking = inspectParking(landing);
        if (!force && isParked(landing)) {
          skip_parked += 1;
          console.log(
            `[promote] ${domain} SKIP parked/thin (motivo=${parking.reason})`,
          );
          continue;
        }

        console.log(`[promote] ${domain} calling verifySignal (${signal.status} → VERIFIED)`);
        const verified = await verifySignal(signal.id);
        if (verified.status === "VERIFIED") {
          promovidos += 1;
          console.log(`[promote] ${domain} after-update status=${verified.status}`);
        } else {
          falhas += 1;
          console.log(`[promote] ${domain} after-update status=${verified.status}`);
        }
      } catch (error) {
        falhas += 1;
        const message = error instanceof Error ? error.message : String(error);
        console.log(`[promote] ${domain} FAILED: ${message}`);
      }
    }

    cursorId = batch[batch.length - 1]?.id;
  }

  console.table({ total, promovidos, skip_parked, skip_notlive, falhas });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
