import { prisma } from "../lib/prisma";
import {
  isUpcomingLaunch,
  landingLiveFromRaw,
} from "../lib/signals/saturation";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function stringField(raw: Record<string, unknown> | null, key: string) {
  const value = raw?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function main() {
  const launches = await prisma.launch.findMany({
    where: {
      evidences: { some: {} },
      signals: { some: { status: "VERIFIED" } },
    },
    take: 200,
    orderBy: { lastSeenAt: "desc" },
    select: {
      id: true,
      title: true,
      domain: true,
      producer: { select: { id: true, name: true, domain: true, companyName: true } },
      signals: {
        where: { status: "VERIFIED" },
        select: { source: true, rawData: true, domain: true },
      },
    },
  });

  const launched = launches.filter(
    (launch) =>
      !launch.signals.some((signal) =>
        isUpcomingLaunch({
          source: signal.source,
          landingLive: landingLiveFromRaw(signal.rawData),
        }),
      ),
  );

  const rows = launched.slice(0, 15).map((launch) => {
    const raws = launch.signals.map((signal) => asRecord(signal.rawData));

    const publicName =
      launch.producer.companyName ??
      raws.map((raw) => stringField(raw, "channelTitle")).find(Boolean) ??
      raws.map((raw) => stringField(raw, "companyName")).find(Boolean) ??
      raws
        .map((raw) => {
          const landing = asRecord(asRecord(raw?.httpProbe)?.landing);
          return stringField(landing, "title");
        })
        .find(Boolean) ??
      null;

    return {
      launchId: launch.id,
      domain: launch.domain,
      producerId: launch.producer.id,
      nomeAtual: launch.producer.name,
      producerDomain: launch.producer.domain,
      publicName,
    };
  });

  console.log(JSON.stringify({ launchedCount: launched.length, sample: rows }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
