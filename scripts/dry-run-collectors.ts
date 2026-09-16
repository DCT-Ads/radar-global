import { parseCrtshConfig } from "../lib/collectors/config";
import { fetchCrtshEntries, discoverDomainsFromEntries } from "../lib/collectors/crtsh";
import {
  DIGISTORE24_API_URL,
  DIGISTORE24_PRODUCTS_URL,
  emptyCatalogError,
  parseDigistore24Hits,
} from "../lib/collectors/digistore24";
import {
  formatDropStats,
  lastErrorIfEmpty,
  type CollectorDropStats,
} from "../lib/collectors/drop-stats";
import { markSource } from "../lib/collectors/heartbeat";
import { fetchYoutubeHits } from "../lib/collectors/youtube";
import { persistDiscoveredDomain } from "../lib/collectors/persist";
import { getDigistore24ApiKey } from "../lib/integrations/digistore24-config";
import { upsertDigistore24Signal } from "../lib/signals/persist-digistore24";
import { upsertYoutubeSignal } from "../lib/signals/persist-youtube";
import { prisma } from "../lib/prisma";
import { ensureSources, SOURCE_SLUGS } from "../lib/sources";

const APPLY = process.argv.includes("--apply");

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function dryCrtsh(keywords: string[], maxAgeDays: number, limit: number) {
  const reasons: Array<Record<string, unknown>> = [];
  const keptDomains: string[] = [];
  let statsSum: CollectorDropStats | null = null;
  let created = 0;
  for (const keyword of keywords) {
    const entries = await fetchCrtshEntries(keyword);
    const { domains, stats } = discoverDomainsFromEntries(
      entries,
      keyword,
      maxAgeDays,
      limit,
    );
    if (!statsSum) {
      statsSum = { ...stats };
    } else {
      statsSum.fetched += stats.fetched;
      statsSum.keywordMiss += stats.keywordMiss;
      statsSum.noNiche += stats.noNiche;
      statsSum.tooOld += stats.tooOld;
      statsSum.apexMiss += stats.apexMiss;
      statsSum.kept += stats.kept;
    }
    reasons.push({
      keyword,
      ...stats,
      sample: domains.slice(0, 5).map((item) => ({
        domain: item.domain,
        ageDays: Math.round(item.ageDays * 10) / 10,
      })),
    });
    for (const item of domains) {
      keptDomains.push(item.domain);
      if (APPLY) {
        const saved = await persistDiscoveredDomain(item);
        if (saved.created) {
          created += 1;
        }
      }
    }
    await sleep(1_500);
  }
  if (APPLY && statsSum) {
    await markSource(
      SOURCE_SLUGS.crtsh,
      "ACTIVE",
      lastErrorIfEmpty("crt.sh", statsSum),
    );
  }
  return {
    source: "crt.sh",
    apply: APPLY,
    stats: statsSum,
    summary: statsSum ? formatDropStats("crt.sh", statsSum) : null,
    perKeyword: reasons,
    keptDomains: [...new Set(keptDomains)],
    signalsGravados: created,
  };
}

async function dryYoutube(keywords: string[], maxHits: number) {
  const { hits, stats } = await fetchYoutubeHits({ keywords, maxHits });
  let created = 0;
  if (APPLY) {
    for (const hit of hits) {
      const saved = await upsertYoutubeSignal(hit);
      if (saved.created) {
        created += 1;
      }
    }
    await markSource(SOURCE_SLUGS.youtube, "ACTIVE", lastErrorIfEmpty("youtube", stats));
  }
  return {
    source: "youtube",
    apply: APPLY,
    stats,
    summary: formatDropStats("youtube", stats),
    signalsGravados: created,
    sample: hits.slice(0, 8).map((hit) => ({
      title: hit.title,
      keyword: hit.keyword,
      url: hit.url,
    })),
  };
}

async function dryDigistore(keywords: string[], maxHits: number) {
  const apiKey = await getDigistore24ApiKey();
  if (!apiKey) {
    return { source: "digistore24", error: "DIGISTORE24_API_KEY is missing" };
  }
  const marketplace = await fetch(DIGISTORE24_API_URL, {
    headers: { "X-DS-API-KEY": apiKey, Accept: "application/json" },
    cache: "no-store",
  });
  const marketplaceJson: unknown = await marketplace.json();
  const parsed = parseDigistore24Hits(marketplaceJson, keywords, maxHits);
  let vendorProductCount: number | null = null;
  try {
    const products = await fetch(DIGISTORE24_PRODUCTS_URL, {
      headers: { "X-DS-API-KEY": apiKey, Accept: "application/json" },
      cache: "no-store",
    });
    const body = (await products.json()) as {
      totalCount?: unknown;
      data?: { totalCount?: unknown; products?: unknown[] };
      products?: unknown[];
    };
    const raw = body.totalCount ?? body.data?.totalCount;
    vendorProductCount =
      typeof raw === "number"
        ? raw
        : Array.isArray(body.products)
          ? body.products.length
          : Array.isArray(body.data?.products)
            ? body.data.products.length
            : null;
  } catch {
    vendorProductCount = null;
  }
  let created = 0;
  if (APPLY && parsed.catalogCount > 0) {
    for (const hit of parsed.hits) {
      const saved = await upsertDigistore24Signal(hit);
      if (saved.created) {
        created += 1;
      }
    }
  }
  if (APPLY) {
    if (parsed.catalogCount === 0) {
      await markSource(
        SOURCE_SLUGS.digistore24,
        "ERROR",
        emptyCatalogError(parsed.catalogCount, vendorProductCount, parsed.stats).message,
      );
    } else {
      await markSource(
        SOURCE_SLUGS.digistore24,
        "ACTIVE",
        lastErrorIfEmpty("digistore24", parsed.stats),
      );
    }
  }
  return {
    source: "digistore24",
    apply: APPLY,
    catalogCount: parsed.catalogCount,
    vendorProductCount,
    endpointPublic: DIGISTORE24_API_URL,
    endpointVendor: DIGISTORE24_PRODUCTS_URL,
    stats: parsed.stats,
    summary: formatDropStats("digistore24", parsed.stats),
    catalogProblem: parsed.catalogCount === 0,
    signalsGravados: created,
    sample: parsed.hits.slice(0, 5).map((hit) => ({
      headline: hit.headline,
      keyword: hit.keyword,
      domain: hit.domain,
    })),
  };
}

async function main() {
  await ensureSources();
  const crtsh = await prisma.source.findUnique({
    where: { slug: SOURCE_SLUGS.crtsh },
    select: { config: true },
  });
  const config = parseCrtshConfig(crtsh?.config);
  const keywords = config.keywords;

  const youtube = await dryYoutube(keywords, config.maxDomainsPerRun);
  const digistore = await dryDigistore(keywords, config.maxDomainsPerRun);
  const crtshResult = await dryCrtsh(
    keywords,
    config.maxAgeDays,
    config.maxDomainsPerKeyword,
  );

  console.log(
    JSON.stringify(
      {
        apply: APPLY,
        keywords,
        maxAgeDays: config.maxAgeDays,
        youtube,
        digistore,
        crtsh: crtshResult,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
