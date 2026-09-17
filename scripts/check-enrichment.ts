import { prisma } from "../lib/prisma";
import {
  getSaturationLevel,
  indexKeywordVolumes,
} from "../lib/signals/saturation";
import { ageInDays } from "../lib/collectors/domains";

async function main() {
  const [total, zero, withCountry, withLang, grouped, keywordCounts, sample] =
    await Promise.all([
      prisma.signal.count(),
      prisma.signal.count({ where: { confidence: 0 } }),
      prisma.signal.count({ where: { countryHint: { not: null } } }),
      prisma.signal.count({ where: { langHint: { not: null } } }),
      prisma.signal.groupBy({
        by: ["confidence"],
        _count: { _all: true },
        orderBy: { confidence: "asc" },
      }),
      prisma.signal.groupBy({
        by: ["keyword"],
        _count: { _all: true },
      }),
      prisma.signal.findMany({
        take: 12,
        orderBy: { discoveredAt: "desc" },
        select: {
          domain: true,
          keyword: true,
          confidence: true,
          countryHint: true,
          langHint: true,
          discoveredAt: true,
        },
      }),
    ]);

  const { byKeyword, median, p75 } = indexKeywordVolumes(keywordCounts);
  const distinctConfidence = grouped.length;
  const levels = { SATURATED: 0, WARNING: 0, SAFE: 0 };
  const latest = await prisma.signal.findMany({
    take: 100,
    orderBy: { discoveredAt: "desc" },
    select: { keyword: true, confidence: true, discoveredAt: true },
  });
  for (const signal of latest) {
    const level = getSaturationLevel({
      keyword: signal.keyword,
      keywordVolume: signal.keyword ? (byKeyword[signal.keyword] ?? 1) : 0,
      medianVolume: median,
      p75Volume: p75,
      confidence: signal.confidence,
      firstSeenDaysAgo: ageInDays(signal.discoveredAt),
    });
    if (level) {
      levels[level] += 1;
    }
  }

  console.log(
    JSON.stringify(
      {
        total,
        zero,
        withCountry,
        withLang,
        distinctConfidence,
        median,
        p75,
        keywordCounts: Object.fromEntries(
          keywordCounts.map((row) => [row.keyword ?? "null", row._count._all]),
        ),
        levels,
        sample,
      },
      null,
      2,
    ),
  );
  await prisma.$disconnect();
}

main();
