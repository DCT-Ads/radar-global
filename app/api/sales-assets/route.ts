import { NextResponse } from "next/server";
import { requirePremiumApi } from "@/lib/auth/require-feature";
import { toSalesAssetDto } from "@/lib/copy/asset-dto";
import {
  httpsUrl,
  isPresellTemplate,
  presellSlug,
  type CopyLanguage,
} from "@/lib/copy/pack";
import { prisma } from "@/lib/prisma";

function textField(body: unknown, key: string, max: number) {
  if (!body || typeof body !== "object" || !(key in body)) return "";
  const value = (body as Record<string, unknown>)[key];
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function lines(body: unknown, key: string, max: number, itemMax: number) {
  if (!body || typeof body !== "object" || !(key in body)) return [];
  const value = (body as Record<string, unknown>)[key];
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim().slice(0, itemMax))
    .filter(Boolean)
    .slice(0, max);
}

function indexField(body: unknown, key: string, max: number) {
  if (!body || typeof body !== "object" || !(key in body)) return 0;
  const value = (body as Record<string, unknown>)[key];
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value >= max) return 0;
  return value;
}

export async function GET() {
  const { user, response } = await requirePremiumApi();
  if (!user || response) return response;

  const rows = await prisma.salesAsset.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ assets: rows.map(toSalesAssetDto) });
}

export async function POST(req: Request) {
  const { user, response } = await requirePremiumApi();
  if (!user || response) return response;

  const body: unknown = await req.json().catch(() => null);
  const duplicateId = textField(body, "duplicateId", 40);
  if (duplicateId) {
    const source = await prisma.salesAsset.findFirst({
      where: { id: duplicateId, userId: user.id },
    });
    if (!source) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    const copy = await prisma.salesAsset.create({
      data: {
        userId: user.id,
        slug: presellSlug(source.product),
        product: source.product,
        niche: source.niche,
        market: source.market,
        stage: source.stage,
        whyRising: source.whyRising,
        format: source.format,
        language: source.language,
        framework: source.framework,
        headlines: source.headlines ?? [],
        body: source.body,
        ctas: source.ctas ?? [],
        shortCopy: source.shortCopy,
        longCopy: source.longCopy,
        presellTemplate: source.presellTemplate,
        mediaUrl: source.mediaUrl,
        checkoutUrl: source.checkoutUrl,
        headlineIndex: source.headlineIndex,
        ctaIndex: source.ctaIndex,
        published: false,
      },
    });
    return NextResponse.json({ asset: toSalesAssetDto(copy) });
  }

  const product = textField(body, "product", 160);
  const niche = textField(body, "niche", 240);
  const headlines = lines(body, "headlines", 3, 180);
  const ctas = lines(body, "ctas", 3, 120);
  const longCopy = textField(body, "longCopy", 6000);
  if (!product || !niche || headlines.length < 3 || ctas.length < 3 || !longCopy) {
    return NextResponse.json({ error: "MISSING" }, { status: 400 });
  }

  const locale = textField(body, "language", 8);
  const language: CopyLanguage = locale === "pt" || locale === "es" ? locale : "en";
  const templateRaw = textField(body, "template", 20);
  const row = await prisma.salesAsset.create({
    data: {
      userId: user.id,
      slug: presellSlug(product),
      product,
      niche,
      market: textField(body, "market", 16) || null,
      stage: textField(body, "stage", 40) || null,
      whyRising: textField(body, "whyRising", 1500) || null,
      format: textField(body, "format", 40) || null,
      language,
      framework: textField(body, "framework", 8) === "PAS" ? "PAS" : "AIDA",
      headlines,
      body: textField(body, "body", 2500),
      ctas,
      shortCopy: textField(body, "shortCopy", 700),
      longCopy,
      presellTemplate: isPresellTemplate(templateRaw) ? templateRaw : null,
      mediaUrl: httpsUrl(textField(body, "mediaUrl", 500)) || null,
      checkoutUrl: httpsUrl(textField(body, "checkoutUrl", 500)) || null,
      headlineIndex: indexField(body, "headlineIndex", headlines.length),
      ctaIndex: indexField(body, "ctaIndex", ctas.length),
      published: false,
    },
  });
  return NextResponse.json({ asset: toSalesAssetDto(row) });
}
