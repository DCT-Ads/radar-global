import type { Prisma, SignalStatus } from "@prisma/client";
import { NRD_SOURCE } from "@/lib/collectors/nrd";
import { prisma } from "@/lib/prisma";

export const REVIEW_SOURCES = [
  "whoisds",
  "crt.sh",
  "digistore24",
  "youtube",
  "muncheye",
] as const;

export type ReviewSource = (typeof REVIEW_SOURCES)[number];

export const REVIEW_PAGE_SIZE = 50;

export function isReviewSource(value: string | undefined): value is ReviewSource {
  return REVIEW_SOURCES.includes(value as ReviewSource);
}

export function interleaveBySource<T extends { source: string }>(batches: T[][]): T[] {
  const max = Math.max(0, ...batches.map((batch) => batch.length));
  const mixed: T[] = [];
  for (let i = 0; i < max; i += 1) {
    for (const batch of batches) {
      const row = batch[i];
      if (row) {
        mixed.push(row);
      }
    }
  }
  return mixed;
}

const includeLaunch = {
  launch: { select: { status: true as const } },
};

export async function fetchReviewSignals(input: {
  status: SignalStatus;
  source?: ReviewSource;
  upcomingOnly?: boolean;
  page: number;
}) {
  const page = Math.max(0, input.page);
  const whereBase: Prisma.SignalWhereInput = input.upcomingOnly
    ? { status: input.status, source: NRD_SOURCE }
    : { status: input.status };

  if (input.upcomingOnly || input.source) {
    const where: Prisma.SignalWhereInput = input.source
      ? { ...whereBase, source: input.source }
      : whereBase;
    const [rows, total] = await Promise.all([
      prisma.signal.findMany({
        where,
        orderBy: { discoveredAt: "desc" },
        skip: page * REVIEW_PAGE_SIZE,
        take: REVIEW_PAGE_SIZE,
        include: includeLaunch,
      }),
      prisma.signal.count({ where }),
    ]);
    return { rows, total, page, pageSize: REVIEW_PAGE_SIZE };
  }

  const perSource = Math.max(8, Math.ceil(REVIEW_PAGE_SIZE / REVIEW_SOURCES.length));
  const batches = await Promise.all(
    REVIEW_SOURCES.map((source) =>
      prisma.signal.findMany({
        where: { ...whereBase, source },
        orderBy: { discoveredAt: "desc" },
        skip: page * perSource,
        take: perSource,
        include: includeLaunch,
      }),
    ),
  );
  const rows = interleaveBySource(batches);
  const total = await prisma.signal.count({ where: whereBase });
  return { rows, total, page, pageSize: REVIEW_PAGE_SIZE };
}

export async function countReviewBySource(status: SignalStatus) {
  const grouped = await prisma.signal.groupBy({
    by: ["source"],
    where: { status },
    _count: { _all: true },
  });
  return Object.fromEntries(
    grouped.map((row) => [row.source, row._count._all]),
  ) as Record<string, number>;
}
