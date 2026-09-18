import { prisma } from "@/lib/prisma";
import { indexKeywordVolumes } from "@/lib/signals/saturation";

export type KeywordVolumeContext = {
  byKeyword: Record<string, number>;
  maxVolume: number;
};

export type KeywordVolumeIndex = KeywordVolumeContext & {
  median: number;
  p75: number;
};

let cached: { at: number; value: KeywordVolumeIndex } | null = null;
const CACHE_MS = 30_000;

export async function loadKeywordVolumeIndex(
  force = false,
): Promise<KeywordVolumeIndex> {
  if (!force && cached && Date.now() - cached.at < CACHE_MS) {
    return cached.value;
  }
  const grouped = await prisma.signal.groupBy({
    by: ["keyword"],
    _count: { _all: true },
  });
  const { byKeyword, median, p75 } = indexKeywordVolumes(grouped);
  const maxVolume = Math.max(1, ...Object.values(byKeyword), 1);
  const value = { byKeyword, median, p75, maxVolume };
  cached = { at: Date.now(), value };
  return value;
}

export async function loadKeywordVolumeContext(
  force = false,
): Promise<KeywordVolumeContext> {
  const { byKeyword, maxVolume } = await loadKeywordVolumeIndex(force);
  return { byKeyword, maxVolume };
}
