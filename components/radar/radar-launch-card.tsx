import { Check } from "lucide-react";
import { SignalTableSaturation } from "@/components/admin/signal-table-saturation";
import { FavoriteStar } from "@/components/radar/favorite-star";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { copyFromRadarHref } from "@/lib/copy/from-radar";
import { formatRelativeTime } from "@/lib/format/relative-time";
import type { RadarLaunchRow } from "@/lib/radar/list";
import type { ReactNode } from "react";

export type RadarLaunchCardLabels = {
  generateCopy: string;
  openLaunch: string;
  earlySignal: string;
  firstSeen: string;
  evidence: string;
  satSaturated: string;
  satWarning: string;
  satSafe: string;
  upcoming: string;
  satUnknown: string;
  verified: string;
  verifiedHint: string;
  favoriteAdd: string;
  favoriteRemove: string;
  favoriteAdded: string;
  favoriteRemoved: string;
};

export function radarLaunchCardLabels(
  t: {
    (key:
      | "generateCopy"
      | "openLaunch"
      | "earlySignal"
      | "firstSeen"
      | "evidence"
      | "satSaturated"
      | "satWarning"
      | "satSafe"
      | "upcoming"
      | "satUnknown"
      | "verified"
      | "verifiedHint"): string;
  },
  favorite: { add: string; remove: string; added: string; removed: string },
): RadarLaunchCardLabels {
  return {
    generateCopy: t("generateCopy"),
    openLaunch: t("openLaunch"),
    earlySignal: t("earlySignal"),
    firstSeen: t("firstSeen"),
    evidence: t("evidence"),
    satSaturated: t("satSaturated"),
    satWarning: t("satWarning"),
    satSafe: t("satSafe"),
    upcoming: t("upcoming"),
    satUnknown: t("satUnknown"),
    verified: t("verified"),
    verifiedHint: t("verifiedHint"),
    favoriteAdd: favorite.add,
    favoriteRemove: favorite.remove,
    favoriteAdded: favorite.added,
    favoriteRemoved: favorite.removed,
  };
}

type RadarLaunchCardProps = {
  row: RadarLaunchRow;
  locale: string;
  favorited: boolean;
  empty: string;
  formatAbsolute: (date: Date) => string;
  labels: RadarLaunchCardLabels;
  extra?: ReactNode;
};

function VerifiedBadge({ label, hint }: { label: string; hint: string }) {
  return (
    <span
      title={hint}
      aria-label={`${label}. ${hint}`}
      className="inline-flex max-w-full items-center gap-1 rounded-full border border-[#D4AF37]/45 bg-[#D4AF37]/12 px-2.5 py-0.5 text-xs font-semibold text-[#D4AF37]"
    >
      <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
      <span>{label}</span>
    </span>
  );
}

export function RadarLaunchCard({
  row,
  locale,
  favorited,
  empty,
  formatAbsolute,
  labels,
  extra,
}: RadarLaunchCardProps) {
  return (
    <Card className="border-[#1E3A5F] bg-[#12263F]/80 text-[#F5F7FA]">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-lg text-[#D4AF37]">
            <Link href={`/launches/${row.id}`} className="hover:underline">
              {row.title}
            </Link>
          </CardTitle>
          <p className="text-sm text-[#8BA3B8]">{row.domain}</p>
          <p className="text-xs text-[#8BA3B8]">
            <Link href={`/producers/${row.producer.id}`} className="hover:text-[#00C2CB]">
              {row.producer.name}
            </Link>
            {row.niche ? ` · ${row.niche}` : ""}
            {row.keyword ? ` · ${row.keyword}` : ""}
          </p>
          {extra}
        </div>
        <div className="flex flex-col items-start gap-1.5 sm:items-end">
          <FavoriteStar
            launchId={row.id}
            favorited={favorited}
            labels={{
              add: labels.favoriteAdd,
              remove: labels.favoriteRemove,
              added: labels.favoriteAdded,
              removed: labels.favoriteRemoved,
            }}
          />
          {row.verified ? (
            <VerifiedBadge label={labels.verified} hint={labels.verifiedHint} />
          ) : null}
          <SignalTableSaturation
            level={row.saturation}
            upcoming={row.upcoming}
            labels={{
              saturated: labels.satSaturated,
              moderate: labels.satWarning,
              hot: labels.satSafe,
              upcomingLaunch: labels.upcoming,
              unknown: labels.satUnknown,
            }}
          />
        </div>
      </CardHeader>
      <CardContent className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex gap-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-[#8BA3B8]">{labels.earlySignal}</p>
            <p className="text-2xl font-semibold text-[#F5F7FA]">
              {row.earlySignal == null ? empty : row.earlySignal}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-[#8BA3B8]">{labels.firstSeen}</p>
            <p className="text-sm text-[#F5F7FA]">
              {formatRelativeTime(row.firstSeenAt, locale) || empty}
            </p>
            <p className="text-xs text-[#8BA3B8]">{formatAbsolute(row.firstSeenAt)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-[#8BA3B8]">{labels.evidence}</p>
            <p className="text-sm text-[#F5F7FA]">{row.evidenceCount}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={copyFromRadarHref(row.title, row.niche, {
              stage: row.saturation ?? undefined,
            })}
            className="rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-[#0B1A2F] transition hover:brightness-110"
          >
            {labels.generateCopy}
          </Link>
          <Link
            href={`/launches/${row.id}`}
            className="text-sm font-medium text-[#00C2CB] hover:underline"
          >
            {labels.openLaunch}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
