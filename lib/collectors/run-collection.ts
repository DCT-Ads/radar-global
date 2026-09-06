import { parseCrtshConfig } from "./config";
import { discoverDomainsFromEntries, fetchCrtshEntries, type DiscoveredDomain } from "./crtsh";
import { markSource, withSourceHeartbeat } from "./heartbeat";
import {
  fetchDigistore24Hits,
  type Digistore24FetchFn,
} from "./digistore24";
import { fetchNrdHits, type NrdHit } from "./nrd";
import { fetchYoutubeHits, type YoutubeFetchFn } from "./youtube";
import { probeLaunch } from "./http-probe";
import { persistDiscoveredDomain, persistHttpProbe } from "./persist";
import { upsertDigistore24Signal } from "@/lib/signals/persist-digistore24";
import { upsertNrdSignal } from "@/lib/signals/persist-nrd";
import { upsertYoutubeSignal } from "@/lib/signals/persist-youtube";
import { ensureSources, getSourceBySlug, SOURCE_SLUGS } from "@/lib/sources";

const KEYWORD_GAP_MS = 1_500;

export type CollectionResult = {
  keywords: string[];
  discovered: number;
  probed: number;
  nrdDiscovered: number;
  digistore24Discovered: number;
  youtubeDiscovered: number;
  errors: string[];
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runNrdCollection(
  keywords: string[],
  maxHits: number,
  errors: string[],
  fetchHits: (input: {
    keywords?: string[];
    maxHits: number;
  }) => Promise<{ hits: NrdHit[]; listDate: string }> = fetchNrdHits,
) {
  await ensureSources();
  const nrd = await getSourceBySlug(SOURCE_SLUGS.nrd);
  if (nrd.status === "PAUSED" || nrd.status === "DISABLED") {
    return 0;
  }

  try {
    return await withSourceHeartbeat(SOURCE_SLUGS.nrd, async () => {
      const { hits } = await fetchHits({ keywords, maxHits });
      let persisted = 0;
      for (const hit of hits) {
        const saved = await upsertNrdSignal(hit);
        persisted += 1;
        try {
          const probe = await probeLaunch(hit.domain);
          await persistHttpProbe(saved.signal.id, probe);
        } catch (error) {
          errors.push(
            `nrd probe ${hit.domain}: ${error instanceof Error ? error.message : "unknown error"}`,
          );
        }
      }
      return persisted;
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "NRD collection failed";
    errors.push(`whoisds: ${message}`);
    return 0;
  }
}

export async function runDigistore24Collection(
  keywords: string[],
  maxHits: number,
  errors: string[],
  fetchFn?: Digistore24FetchFn,
) {
  await ensureSources();
  const source = await getSourceBySlug(SOURCE_SLUGS.digistore24);
  if (source.status === "PAUSED" || source.status === "DISABLED") {
    return 0;
  }

  try {
    return await withSourceHeartbeat(SOURCE_SLUGS.digistore24, async () => {
      const { hits } = await fetchDigistore24Hits({ keywords, maxHits, fetchFn });
      let persisted = 0;
      for (const hit of hits) {
        await upsertDigistore24Signal(hit);
        persisted += 1;
      }
      return persisted;
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Digistore24 collection failed";
    errors.push(`digistore24: ${message}`);
    return 0;
  }
}

export async function runYoutubeCollection(
  keywords: string[],
  maxHits: number,
  errors: string[],
  fetchFn?: YoutubeFetchFn,
) {
  await ensureSources();
  const source = await getSourceBySlug(SOURCE_SLUGS.youtube);
  if (source.status === "PAUSED" || source.status === "DISABLED") {
    return 0;
  }

  try {
    return await withSourceHeartbeat(SOURCE_SLUGS.youtube, async () => {
      const { hits } = await fetchYoutubeHits({ keywords, maxHits, fetchFn });
      let persisted = 0;
      for (const hit of hits) {
        await upsertYoutubeSignal(hit);
        persisted += 1;
      }
      return persisted;
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "YouTube collection failed";
    errors.push(`youtube: ${message}`);
    return 0;
  }
}

export async function runCrtshCollection(): Promise<CollectionResult> {
  await ensureSources();
  const crtsh = await getSourceBySlug(SOURCE_SLUGS.crtsh);
  const httpProbe = await getSourceBySlug(SOURCE_SLUGS.httpProbe);

  const config = parseCrtshConfig(crtsh.config);
  const keywordOverride = process.env.COLLECT_KEYWORDS?.split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  if (keywordOverride?.length) {
    config.keywords = keywordOverride;
  }
  if (process.env.COLLECT_MAX_DOMAINS) {
    config.maxDomainsPerRun = Number(process.env.COLLECT_MAX_DOMAINS);
    config.maxDomainsPerKeyword = Math.min(
      config.maxDomainsPerKeyword,
      config.maxDomainsPerRun,
    );
  }
  const seen = new Set<string>();
  const discovered: DiscoveredDomain[] = [];
  const errors: string[] = [];
  const nrdDiscovered = await runNrdCollection(config.keywords, config.maxDomainsPerRun, errors);
  const digistore24Discovered = await runDigistore24Collection(
    config.keywords,
    config.maxDomainsPerRun,
    errors,
  );
  const youtubeDiscovered = await runYoutubeCollection(
    config.keywords,
    config.maxDomainsPerRun,
    errors,
  );

  if (crtsh.status === "PAUSED" || crtsh.status === "DISABLED") {
    return {
      keywords: config.keywords,
      discovered: 0,
      probed: 0,
      nrdDiscovered,
      digistore24Discovered,
      youtubeDiscovered,
      errors: [...errors, `crt.sh is ${crtsh.status}`],
    };
  }

  try {
    for (const keyword of config.keywords) {
      try {
        const entries = await fetchCrtshEntries(keyword);
        const domains = discoverDomainsFromEntries(
          entries,
          keyword,
          config.maxAgeDays,
          config.maxDomainsPerKeyword,
        );
        for (const item of domains) {
          if (seen.has(item.domain) || discovered.length >= config.maxDomainsPerRun) {
            continue;
          }
          seen.add(item.domain);
          discovered.push(item);
        }
      } catch (error) {
        errors.push(
          `crt.sh keyword "${keyword}": ${error instanceof Error ? error.message : "unknown error"}`,
        );
      }
      await sleep(KEYWORD_GAP_MS);
    }

    let probed = 0;
    for (const item of discovered) {
      const persisted = await persistDiscoveredDomain(item);
      try {
        const probe = await probeLaunch(item.domain);
        await persistHttpProbe(persisted.signal.id, probe);
        probed += 1;
      } catch (error) {
        errors.push(
          `probe ${item.domain}: ${error instanceof Error ? error.message : "unknown error"}`,
        );
      }
    }

    await markSource(SOURCE_SLUGS.crtsh, errors.length && !discovered.length ? "ERROR" : "ACTIVE", errors[0] ?? null);
    await markSource(
      SOURCE_SLUGS.httpProbe,
      errors.some((item) => item.startsWith("probe ")) && probed === 0 ? "ERROR" : "ACTIVE",
      errors.find((item) => item.startsWith("probe ")) ?? null,
    );

    return {
      keywords: config.keywords,
      discovered: discovered.length,
      probed,
      nrdDiscovered,
      digistore24Discovered,
      youtubeDiscovered,
      errors,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Collection failed";
    await markSource(SOURCE_SLUGS.crtsh, "ERROR", message);
    throw error;
  }
}
