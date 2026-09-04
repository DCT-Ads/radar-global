import { parseCrtshConfig } from "./config";
import { discoverDomainsFromEntries, fetchCrtshEntries, type DiscoveredDomain } from "./crtsh";
import { probeLaunch } from "./http-probe";
import { persistDiscoveredDomain, persistHttpProbe } from "./persist";
import { prisma } from "@/lib/prisma";
import { ensureSources, getSourceBySlug, SOURCE_SLUGS } from "@/lib/sources";

const KEYWORD_GAP_MS = 1_500;

export type CollectionResult = {
  keywords: string[];
  discovered: number;
  probed: number;
  errors: string[];
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function markSource(
  slug: string,
  status: "ACTIVE" | "ERROR",
  lastError: string | null,
) {
  await prisma.source.update({
    where: { slug },
    data: {
      status,
      lastRunAt: new Date(),
      lastError,
    },
  });
}

export async function runCrtshCollection(): Promise<CollectionResult> {
  await ensureSources();
  const crtsh = await getSourceBySlug(SOURCE_SLUGS.crtsh);
  const httpProbe = await getSourceBySlug(SOURCE_SLUGS.httpProbe);

  if (crtsh.status === "PAUSED" || crtsh.status === "DISABLED") {
    return { keywords: [], discovered: 0, probed: 0, errors: [`crt.sh is ${crtsh.status}`] };
  }

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
      const launch = await persistDiscoveredDomain(item, crtsh);
      try {
        const probe = await probeLaunch(item.domain);
        await persistHttpProbe(launch.id, probe, httpProbe);
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
      errors,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Collection failed";
    await markSource(SOURCE_SLUGS.crtsh, "ERROR", message);
    throw error;
  }
}
