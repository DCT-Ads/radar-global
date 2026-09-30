import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { PresellView } from "@/components/presell/presell-view";
import { toSalesAssetDto } from "@/lib/copy/asset-dto";
import { assertLocale } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import type { PresellContent } from "@/lib/presell/document";

type PresellPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function PresellPage({ params }: PresellPageProps) {
  const { locale, slug } = await params;
  setRequestLocale(assertLocale(locale));

  const row = await prisma.salesAsset.findFirst({
    where: { slug, published: true },
  });
  if (!row) notFound();

  const asset = toSalesAssetDto(row);
  const headline = asset.headlines[asset.headlineIndex] ?? asset.headlines[0] ?? asset.product;
  const cta = asset.ctas[asset.ctaIndex] ?? asset.ctas[0] ?? asset.product;
  const content: PresellContent = {
    template: asset.template ?? "blog",
    language: asset.language,
    product: asset.product,
    niche: asset.niche,
    whyRising: asset.whyRising,
    headline,
    body: asset.body,
    longCopy: asset.longCopy,
    shortCopy: asset.shortCopy,
    cta,
    mediaUrl: asset.mediaUrl,
    checkoutUrl: asset.checkoutUrl,
  };

  return (
    <div className="min-h-screen bg-[#0B1C33]">
      <PresellView content={content} />
    </div>
  );
}
