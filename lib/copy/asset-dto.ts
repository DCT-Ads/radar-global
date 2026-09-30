import type { SalesAsset } from "@prisma/client";
import {
  asStringList,
  isPresellTemplate,
  type CopyLanguage,
  type PresellTemplate,
} from "@/lib/copy/pack";

export type SalesAssetDto = {
  id: string;
  slug: string;
  product: string;
  niche: string;
  market: string;
  stage: string;
  whyRising: string;
  format: string;
  language: CopyLanguage;
  framework: "AIDA" | "PAS";
  headlines: string[];
  body: string;
  ctas: string[];
  shortCopy: string;
  longCopy: string;
  template: PresellTemplate | null;
  mediaUrl: string;
  checkoutUrl: string;
  headlineIndex: number;
  ctaIndex: number;
  published: boolean;
  updatedAt: string;
};

export function toSalesAssetDto(row: SalesAsset): SalesAssetDto {
  const language: CopyLanguage =
    row.language === "pt" || row.language === "es" ? row.language : "en";
  return {
    id: row.id,
    slug: row.slug,
    product: row.product,
    niche: row.niche,
    market: row.market ?? "",
    stage: row.stage ?? "",
    whyRising: row.whyRising ?? "",
    format: row.format ?? "",
    language,
    framework: row.framework === "PAS" ? "PAS" : "AIDA",
    headlines: asStringList(row.headlines),
    body: row.body,
    ctas: asStringList(row.ctas),
    shortCopy: row.shortCopy,
    longCopy: row.longCopy,
    template: isPresellTemplate(row.presellTemplate) ? row.presellTemplate : null,
    mediaUrl: row.mediaUrl ?? "",
    checkoutUrl: row.checkoutUrl ?? "",
    headlineIndex: row.headlineIndex,
    ctaIndex: row.ctaIndex,
    published: row.published,
    updatedAt: row.updatedAt.toISOString(),
  };
}
