import { NextResponse } from "next/server";
import { requirePremiumApi } from "@/lib/auth/require-feature";
import { toSalesAssetDto } from "@/lib/copy/asset-dto";
import { httpsUrl, isPresellTemplate } from "@/lib/copy/pack";
import { prisma } from "@/lib/prisma";

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

function textField(body: unknown, key: string, max: number) {
  if (!body || typeof body !== "object" || !(key in body)) return undefined;
  const value = (body as Record<string, unknown>)[key];
  if (typeof value !== "string") return undefined;
  return value.trim().slice(0, max);
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { user, response } = await requirePremiumApi();
  if (!user || response) return response;

  const { id } = await context.params;
  const current = await prisma.salesAsset.findFirst({ where: { id, userId: user.id } });
  if (!current) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const body: unknown = await req.json().catch(() => null);
  const published =
    body && typeof body === "object" && "published" in body && typeof body.published === "boolean"
      ? body.published
      : undefined;
  const templateRaw = textField(body, "template", 20);
  const media = textField(body, "mediaUrl", 500);
  const checkout = textField(body, "checkoutUrl", 500);
  const headlineIndex =
    body && typeof body === "object" && "headlineIndex" in body && typeof body.headlineIndex === "number"
      ? body.headlineIndex
      : undefined;
  const ctaIndex =
    body && typeof body === "object" && "ctaIndex" in body && typeof body.ctaIndex === "number"
      ? body.ctaIndex
      : undefined;

  const headlines = lines(body, "headlines", 3, 180);
  const ctas = lines(body, "ctas", 3, 120);

  const row = await prisma.salesAsset.update({
    where: { id: current.id },
    data: {
      ...(published === undefined ? {} : { published }),
      ...(templateRaw === undefined
        ? {}
        : { presellTemplate: isPresellTemplate(templateRaw) ? templateRaw : null }),
      ...(media === undefined ? {} : { mediaUrl: httpsUrl(media) || null }),
      ...(checkout === undefined ? {} : { checkoutUrl: httpsUrl(checkout) || null }),
      ...(headlineIndex === undefined || !Number.isInteger(headlineIndex) || headlineIndex < 0
        ? {}
        : { headlineIndex }),
      ...(ctaIndex === undefined || !Number.isInteger(ctaIndex) || ctaIndex < 0 ? {} : { ctaIndex }),
      ...(textField(body, "longCopy", 6000) === undefined
        ? {}
        : { longCopy: textField(body, "longCopy", 6000) }),
      ...(textField(body, "shortCopy", 700) === undefined
        ? {}
        : { shortCopy: textField(body, "shortCopy", 700) }),
      ...(textField(body, "body", 2500) === undefined ? {} : { body: textField(body, "body", 2500) }),
      ...(headlines.length === 3 ? { headlines } : {}),
      ...(ctas.length === 3 ? { ctas } : {}),
    },
  });
  return NextResponse.json({ asset: toSalesAssetDto(row) });
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { user, response } = await requirePremiumApi();
  if (!user || response) return response;
  const { id } = await context.params;
  const current = await prisma.salesAsset.findFirst({ where: { id, userId: user.id } });
  if (!current) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  await prisma.salesAsset.delete({ where: { id: current.id } });
  return NextResponse.json({ ok: true });
}
