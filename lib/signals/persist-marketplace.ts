import type { Prisma, Signal } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { marketplaceLaunchToSignalPayload } from "@/lib/collectors/marketplace/adapter";
import type { MarketplaceLaunch } from "@/lib/collectors/marketplace/types";

export async function persistMarketplaceLaunch(
  item: MarketplaceLaunch,
): Promise<{ signal: Signal | null; created: boolean }> {
  const payload = marketplaceLaunchToSignalPayload(item);

  const existing = await prisma.signal.findUnique({
    where: {
      source_value: { source: payload.source, value: payload.value },
    },
    select: { id: true },
  });

  if (existing) {
    return { signal: null, created: false };
  }

  try {
    const signal = await prisma.signal.create({
      data: {
        type: payload.type,
        source: payload.source,
        value: payload.value,
        url: payload.url,
        niche: payload.niche,
        domain: payload.domain,
        rawData: payload.rawData as Prisma.InputJsonValue,
        confidence: 0,
        status: "NEW",
      },
    });
    return { signal, created: true };
  } catch (error) {
    if (
      typeof error === "object" &&
      error &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return { signal: null, created: false };
    }
    throw error;
  }
}
