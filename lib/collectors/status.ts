import { prisma } from "@/lib/prisma";
import { getReprobeHealth } from "@/lib/collectors/reprobe-nrd";
import { ensureSources, SOURCE_SLUGS } from "@/lib/sources";

export async function getCollectorsStatus() {
  await ensureSources();
  const [sources, reprobe] = await Promise.all([
    prisma.source.findMany({
      orderBy: { name: "asc" },
      select: {
        slug: true,
        name: true,
        status: true,
        reliability: true,
        lastRunAt: true,
        lastError: true,
      },
    }),
    getReprobeHealth(),
  ]);

  return {
    sources: sources
      .filter((source) =>
        (Object.values(SOURCE_SLUGS) as string[]).includes(source.slug),
      )
      .map((source) => ({
        slug: source.slug,
        name: source.name,
        status: source.status,
        reliability: source.reliability,
        lastRunAt: source.lastRunAt?.toISOString() ?? null,
        lastError: source.lastError,
      })),
    reprobe: {
      lastReprobeAt: reprobe.lastReprobeAt?.toISOString() ?? null,
      pendingCount: reprobe.pendingCount,
      stale: reprobe.stale,
    },
  };
}
