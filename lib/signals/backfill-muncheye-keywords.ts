import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { keywordFromMarketplaceRaw, mergeKeywordMeta } from "@/lib/niches";

const MUNCHEYE_SOURCE = "muncheye";

function hasKeywordMeta(rawData: unknown) {
  if (!rawData || typeof rawData !== "object" || Array.isArray(rawData)) {
    return false;
  }
  const raw = rawData as Record<string, unknown>;
  return "kw_domain" in raw || "kw_title" in raw || "keyword_source" in raw;
}

export async function applyMuncheyeKeyword(signal: {
  id: string;
  rawData: unknown;
  domain: string | null;
  value: string;
  keyword: string | null;
  niche: string | null;
  enrichedAt?: Date | null;
}) {
  const inferred = keywordFromMarketplaceRaw(
    signal.rawData,
    signal.value ?? signal.domain,
  );
  const keywordChanged = Boolean(
    inferred.keyword && inferred.keyword !== signal.keyword,
  );
  const extrasMissing = !hasKeywordMeta(signal.rawData);
  if (!keywordChanged && !extrasMissing) {
    return { updated: false, keyword: inferred.keyword ?? signal.keyword };
  }

  await prisma.signal.update({
    where: { id: signal.id },
    data: {
      ...(inferred.keyword
        ? {
            keyword: inferred.keyword,
            niche: inferred.niche ?? signal.niche,
          }
        : {}),
      rawData: mergeKeywordMeta(signal.rawData, inferred) as Prisma.InputJsonValue,
      ...(signal.enrichedAt ? { enrichedAt: new Date() } : {}),
    },
  });
  return { updated: true, keyword: inferred.keyword ?? signal.keyword };
}

export async function backfillMuncheyeKeywords() {
  const rows = await prisma.signal.findMany({
    where: { source: MUNCHEYE_SOURCE },
    select: {
      id: true,
      rawData: true,
      domain: true,
      value: true,
      keyword: true,
      niche: true,
      enrichedAt: true,
    },
  });

  let updated = 0;
  let skipped = 0;
  for (const row of rows) {
    const result = await applyMuncheyeKeyword(row);
    if (result.updated) {
      updated += 1;
    } else {
      skipped += 1;
    }
  }

  const missingKeywords = await prisma.signal.count({
    where: {
      source: MUNCHEYE_SOURCE,
      OR: [{ keyword: null }, { keyword: "" }],
    },
  });

  return { scanned: rows.length, updated, skipped, missingKeywords };
}
