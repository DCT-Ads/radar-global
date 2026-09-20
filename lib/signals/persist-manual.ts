import type { Prisma } from "@prisma/client";
import { PLATFORM_IDS, PLATFORM_LABELS, type PlatformId } from "@/lib/integrations/platforms";
import { prisma } from "@/lib/prisma";
import { verifySignal } from "@/lib/signals/review";

export const MANUAL_PLATFORMS = [...PLATFORM_IDS, "muncheye"] as const;
export type ManualPlatform = (typeof MANUAL_PLATFORMS)[number];

export type ManualLaunchInput = {
  id?: string;
  platform: string;
  productName: string;
  vendor?: string;
  url: string;
  domain?: string;
  keyword?: string;
  niche?: string;
  launchDate?: string;
  notes?: string;
  publish?: boolean;
};

export function isManualPlatform(value: string): value is ManualPlatform {
  return MANUAL_PLATFORMS.includes(value as ManualPlatform);
}

export function platformLabel(platform: ManualPlatform) {
  if (platform === "muncheye") {
    return "MunchEye";
  }
  return PLATFORM_LABELS[platform as PlatformId];
}

function hostFromUrl(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase() || null;
  } catch {
    return null;
  }
}

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

async function ensureManualSource(platform: ManualPlatform) {
  await prisma.source.upsert({
    where: { slug: platform },
    update: { name: platformLabel(platform) },
    create: {
      slug: platform,
      name: platformLabel(platform),
      reliability: 60,
    },
  });
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? { ...(value as Record<string, unknown>) }
    : {};
}

export async function listManualLaunches() {
  return prisma.signal.findMany({
    where: { value: { startsWith: "manual:" } },
    orderBy: { updatedAt: "desc" },
    take: 25,
    select: {
      id: true,
      source: true,
      domain: true,
      url: true,
      keyword: true,
      niche: true,
      status: true,
      rawData: true,
      launchId: true,
    },
  });
}

export async function getManualLaunch(id: string) {
  return prisma.signal.findFirst({
    where: { id, value: { startsWith: "manual:" } },
  });
}

export async function upsertManualLaunch(input: ManualLaunchInput) {
  if (!isManualPlatform(input.platform)) {
    throw new Error("UNKNOWN_PLATFORM");
  }
  const productName = input.productName.trim();
  const url = normalizeUrl(input.url);
  const domain = (input.domain?.trim().replace(/^www\./, "") || hostFromUrl(url) || "").toLowerCase();
  if (!productName || !url || !domain) {
    throw new Error("FIELDS_REQUIRED");
  }

  await ensureManualSource(input.platform);
  const value = `manual:${input.platform}:${domain}`;
  const rawData = {
    manual: true,
    product_name: productName,
    title: productName,
    headline: productName,
    vendor: input.vendor?.trim() || null,
    launch_date: input.launchDate?.trim() || null,
    notes: input.notes?.trim() || null,
    status: "live",
    raw_scraped_at: new Date().toISOString(),
  };

  const existing = input.id
    ? await prisma.signal.findUnique({ where: { id: input.id } })
    : await prisma.signal.findUnique({
        where: { source_value: { source: input.platform, value } },
      });

  const payload = {
    type: "LANDING_PAGE" as const,
    source: input.platform,
    value,
    url,
    domain,
    keyword: input.keyword?.trim() || null,
    niche: input.niche?.trim() || null,
    rawData: rawData as Prisma.InputJsonValue,
    confidence: 80,
  };

  let signal = existing
    ? await prisma.signal.update({
        where: { id: existing.id },
        data: payload,
      })
    : await prisma.signal.create({ data: { ...payload, status: "NEW" } });

  if (input.publish !== false && signal.status !== "VERIFIED") {
    signal = await verifySignal(signal.id);
  } else if (signal.status === "VERIFIED" && signal.launchId) {
    const currentRaw = asRecord(signal.rawData);
    await prisma.launch.update({
      where: { id: signal.launchId },
      data: {
        title: productName,
        niche: signal.niche,
        lastSeenAt: new Date(),
      },
    });
    if (signal.producerId && typeof currentRaw.vendor === "string" && currentRaw.vendor) {
      await prisma.producer.update({
        where: { id: signal.producerId },
        data: { name: currentRaw.vendor },
      });
    }
  }

  return signal;
}
