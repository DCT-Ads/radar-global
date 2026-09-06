import { prisma } from "@/lib/prisma";

export type KeywordVolumeContext = {
  byKeyword: Record<string, number>;
  maxVolume: number;
};

let cached: { at: number; value: KeywordVolumeContext } | null = null;
const CACHE_MS = 15_000;

export async function loadKeywordVolumeContext(
  force = false,
): Promise<KeywordVolumeContext> {
  if (!force && cached && Date.now() - cached.at < CACHE_MS) {
    return cached.value;
  }
  const grouped = await prisma.signal.groupBy({
    by: ["keyword"],
    _count: { _all: true },
  });
  const byKeyword = Object.fromEntries(
    grouped
      .filter((row) => row.keyword)
      .map((row) => [row.keyword as string, row._count._all]),
  );
  const maxVolume = Math.max(1, ...Object.values(byKeyword), 1);
  const value = { byKeyword, maxVolume };
  cached = { at: Date.now(), value };
  return value;
}
