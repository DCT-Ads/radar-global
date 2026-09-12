import { Prisma, type Prisma as PrismaTypes } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { probeLanding } from "../lib/collectors/http-probe";
import { inspectParking } from "../lib/signals/anti-parking";

const BATCH_SIZE = 50;

function asJsonObject(value: PrismaTypes.JsonValue | null): PrismaTypes.InputJsonObject {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return { ...value };
  }
  return {};
}

function chunk<T>(items: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    batches.push(items.slice(index, index + size));
  }
  return batches;
}

function emptyLanding() {
  return {
    live: false,
    status: null,
    title: null,
    body: null,
    bodySnippet: null,
    htmlLang: null,
    ogLocale: null,
  };
}

async function persistLandingMerge(
  signalId: string,
  rawData: PrismaTypes.JsonValue | null,
  landing: ReturnType<typeof emptyLanding> & { url?: string; path?: string },
) {
  const previous = asJsonObject(rawData);
  const previousProbe = asJsonObject(
    previous.httpProbe && typeof previous.httpProbe === "object" && !Array.isArray(previous.httpProbe)
      ? (previous.httpProbe as PrismaTypes.JsonValue)
      : null,
  );
  const previousLanding = asJsonObject(
    previousProbe.landing && typeof previousProbe.landing === "object" && !Array.isArray(previousProbe.landing)
      ? (previousProbe.landing as PrismaTypes.JsonValue)
      : null,
  );
  const parking = inspectParking(landing);

  await prisma.signal.update({
    where: { id: signalId },
    data: {
      rawData: {
        ...previous,
        httpProbe: {
          ...previousProbe,
          landing: {
            ...previousLanding,
            live: landing.live,
            status: landing.status,
            title: landing.title,
            body: landing.body,
            bodySnippet: landing.bodySnippet,
            htmlLang: landing.htmlLang,
            ogLocale: landing.ogLocale,
            ...(landing.url ? { url: landing.url } : {}),
            ...(landing.path ? { path: landing.path } : {}),
          },
        },
        ...(landing.live && parking.parked
          ? {
              antiParking: {
                parked: true,
                reason: parking.reason,
                checkedAt: new Date().toISOString(),
              },
            }
          : {}),
      },
    },
  });
}

async function reprobeOne(signal: {
  id: string;
  domain: string | null;
  value: string;
  rawData: PrismaTypes.JsonValue | null;
}) {
  const domain = signal.domain ?? signal.value;
  try {
    const probed = await probeLanding(domain);
    await persistLandingMerge(signal.id, signal.rawData, {
      live: probed.live,
      status: probed.status,
      title: probed.title,
      body: probed.body,
      bodySnippet: probed.bodySnippet,
      htmlLang: probed.htmlLang,
      ogLocale: probed.ogLocale,
      url: probed.url,
      path: probed.path,
    });
    return { live: probed.live, failed: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`[reprobe-new] ${domain} FAILED: ${message}`);
    try {
      await persistLandingMerge(signal.id, signal.rawData, emptyLanding());
    } catch (persistError) {
      const persistMessage =
        persistError instanceof Error ? persistError.message : String(persistError);
      console.log(`[reprobe-new] ${domain} persist FAILED: ${persistMessage}`);
    }
    return { live: false, failed: true };
  }
}

async function loadPending() {
  return prisma.signal.findMany({
    where: {
      status: "NEW",
      rawData: {
        path: ["antiParking"],
        equals: Prisma.DbNull,
      },
    },
    select: { id: true, domain: true, value: true, rawData: true },
  });
}

async function main() {
  const pending = await loadPending();
  let live = 0;
  let offline = 0;
  let falhas = 0;
  let done = 0;

  console.log(`[reprobe-new] ${pending.length} NEW sem antiParking · lotes de ${BATCH_SIZE}`);

  for (const batch of chunk(pending, BATCH_SIZE)) {
    const results = await Promise.all(batch.map(reprobeOne));
    done += batch.length;
    for (const result of results) {
      if (result.failed) {
        falhas += 1;
      } else if (result.live) {
        live += 1;
      } else {
        offline += 1;
      }
    }
    console.log(`✔ processados ${batch.length} — restam ${pending.length - done}`);
  }

  console.table({ total: pending.length, live, offline, falhas });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
