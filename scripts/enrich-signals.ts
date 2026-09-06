import { pageLocaleFromRawData } from "../lib/collectors/http-probe";
import { prisma } from "../lib/prisma";
import { enrichSignal } from "../lib/signals/enrich";
import { loadKeywordVolumeContext } from "../lib/signals/keyword-volume";

async function main() {
  const [signals, market] = await Promise.all([
    prisma.signal.findMany({
      select: {
        id: true,
        domain: true,
        value: true,
        keyword: true,
        source: true,
        discoveredAt: true,
        rawData: true,
        _count: { select: { evidences: true } },
      },
    }),
    loadKeywordVolumeContext(true),
  ]);

  const chunkSize = 50;
  let updated = 0;
  for (let i = 0; i < signals.length; i += chunkSize) {
    const chunk = signals.slice(i, i + chunkSize);
    await Promise.all(
      chunk.map((signal) => {
        const domain = signal.domain ?? signal.value;
        const keywordVolume = signal.keyword
          ? (market.byKeyword[signal.keyword] ?? 1)
          : 1;
        const enriched = enrichSignal({
          domain,
          keyword: signal.keyword,
          discoveredAt: signal.discoveredAt,
          source: signal.source,
          evidenceCount: signal._count.evidences,
          pageLocale: pageLocaleFromRawData(signal.rawData),
          keywordVolume,
          maxKeywordVolume: market.maxVolume,
        });
        return prisma.signal.update({
          where: { id: signal.id },
          data: {
            confidence: enriched.confidence,
            countryHint: enriched.countryHint,
            langHint: enriched.langHint,
          },
        });
      }),
    );
    updated += chunk.length;
    console.log(`Enriched ${updated}/${signals.length}`);
  }
  await prisma.$disconnect();
}

main();
