import { prisma } from "../lib/prisma";
import {
  isUpcomingSignal,
  landingLiveFromRaw,
} from "../lib/signals/saturation";
import { NRD_SOURCE } from "../lib/collectors/nrd";

async function main() {
  const signals = await prisma.signal.findMany({
    where: { source: NRD_SOURCE },
    include: { launch: { select: { status: true } } },
    orderBy: { discoveredAt: "desc" },
  });
  const upcoming = signals.filter((signal) =>
    isUpcomingSignal({
      source: signal.source,
      rawData: signal.rawData,
      launchStatus: signal.launch?.status,
      landingLive: landingLiveFromRaw(signal.rawData),
    }),
  );
  console.log(
    JSON.stringify(
      {
        nrdTotal: signals.length,
        upcoming: upcoming.length,
        sample: upcoming.slice(0, 6).map((signal) => ({
          domain: signal.domain,
          keyword: signal.keyword,
          launchPending: (signal.rawData as { launchPending?: boolean } | null)
            ?.launchPending,
          landingLive: landingLiveFromRaw(signal.rawData),
        })),
      },
      null,
      2,
    ),
  );
  await prisma.$disconnect();
}

main();
