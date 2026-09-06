import { collectAll, type RawLaunch } from "../lib/collector/crtsh";
import { domainIncludesKeyword } from "../lib/collectors/domains";
import { NICHES } from "../lib/niches";
import { prisma } from "../lib/prisma";
import { upsertCrtshSignal } from "../lib/signals/persist-crtsh";

type FilteredLaunch = RawLaunch & { keyword: string };

function matchingKeyword(domain: string, niche: string): string | null {
  const keywords = NICHES[niche] ?? [];
  return keywords.find((keyword) => domainIncludesKeyword(domain, keyword)) ?? null;
}

function filterByKeywordInDomain(launches: RawLaunch[]): FilteredLaunch[] {
  const byDomain = new Map<string, FilteredLaunch>();

  for (const launch of launches) {
    const keyword = matchingKeyword(launch.domain, launch.niche);
    if (!keyword) {
      continue;
    }

    const current = byDomain.get(launch.domain);
    if (!current) {
      byDomain.set(launch.domain, { ...launch, keyword });
      continue;
    }

    if (
      launch.issuedAt &&
      (!current.issuedAt || launch.issuedAt < current.issuedAt)
    ) {
      byDomain.set(launch.domain, { ...launch, keyword });
    }
  }

  return [...byDomain.values()];
}

async function persistFiltered(launches: FilteredLaunch[]) {
  let created = 0;
  let updated = 0;

  for (const launch of launches) {
    const result = await upsertCrtshSignal({
      domain: launch.domain,
      niche: launch.niche,
      keyword: launch.keyword,
      issuedAt: launch.issuedAt,
    });

    if (result.created) {
      created += 1;
    } else {
      updated += 1;
    }
  }

  return { created, updated };
}

async function main() {
  const collected = await collectAll(NICHES);
  const filtered = filterByKeywordInDomain(collected);
  const { created, updated } = await persistFiltered(filtered);

  console.log(`\n🛰️ Total coletado: ${collected.length}`);
  console.log(`🔎 Total após filtro: ${filtered.length}`);
  console.log(
    `💾 Total gravado: ${created + updated} (created: ${created}, updated/skipped: ${updated})`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
