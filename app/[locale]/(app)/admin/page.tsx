import type { SignalStatus, SourceStatus } from "@prisma/client";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminTabs } from "@/components/admin/admin-tabs";
import { RunCollectionButton } from "@/components/admin/run-collection-button";
import {
  SATURATION_FILTERS,
  SaturationLegend,
  type SaturationFilter,
} from "@/components/admin/saturation-legend";
import { SignalReviewActions } from "@/components/admin/signal-review-actions";
import { SignalTableSaturation } from "@/components/admin/signal-table-saturation";
import { Link } from "@/i18n/navigation";
import { assertLocale } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import {
  getSaturationLevel,
  indexKeywordVolumes,
  isUpcomingLaunch,
  landingLiveFromRaw,
  registeredAtFromRaw,
} from "@/lib/signals/saturation";
import { NRD_SOURCE } from "@/lib/collectors/nrd";
import { ageInDays } from "@/lib/collectors/domains";
import { getReprobeHealth } from "@/lib/collectors/reprobe-nrd";
import { formatRelativeTime } from "@/lib/format/relative-time";
import { ensureSources, SOURCE_SLUGS } from "@/lib/sources";
import { cn } from "@/lib/utils";

const SIGNAL_STATUSES: SignalStatus[] = [
  "NEW",
  "ENRICHING",
  "CANDIDATE",
  "VERIFIED",
  "DISCARDED",
];

const REVIEWABLE: SignalStatus[] = ["NEW", "ENRICHING", "CANDIDATE"];

type AdminPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string; status?: string; sat?: string }>;
};

function statusVariant(status: SourceStatus) {
  if (status === "ACTIVE") {
    return "default" as const;
  }
  if (status === "ERROR") {
    return "destructive" as const;
  }
  return "outline" as const;
}

function isSignalStatus(value: string | undefined): value is SignalStatus {
  return SIGNAL_STATUSES.includes(value as SignalStatus);
}

function isSatFilter(value: string | undefined): value is SaturationFilter {
  return SATURATION_FILTERS.includes(value as SaturationFilter);
}

export default async function AdminPage({ params, searchParams }: AdminPageProps) {
  const { locale } = await params;
  const query = await searchParams;
  setRequestLocale(assertLocale(locale));
  const t = await getTranslations("admin");
  await ensureSources();

  const tab = query.tab === "collectors" ? "collectors" : "review";
  const status = isSignalStatus(query.status) ? query.status : "NEW";
  const sat = isSatFilter(query.sat) ? query.sat : undefined;

  const [sources, counts, fetched, keywordCounts, reprobeHealth] = await Promise.all([
    prisma.source.findMany({ orderBy: { name: "asc" } }),
    prisma.signal.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.signal.findMany({
      where:
            sat === "UPCOMING"
          ? { status, source: NRD_SOURCE }
          : { status },
      orderBy: { discoveredAt: "desc" },
      take: sat ? 400 : 100,
      include: { launch: { select: { status: true } } },
    }),
    prisma.signal.groupBy({
      by: ["keyword"],
      _count: { _all: true },
    }),
    getReprobeHealth(),
  ]);

  const { byKeyword, median, p75 } = indexKeywordVolumes(keywordCounts);

  const withLevel = fetched.map((signal) => {
    const level = getSaturationLevel({
      keywordVolume: signal.keyword ? (byKeyword[signal.keyword] ?? 1) : 1,
      medianVolume: median,
      p75Volume: p75,
      confidence: signal.confidence,
      firstSeenDaysAgo: ageInDays(signal.discoveredAt),
    });
    const upcoming = isUpcomingLaunch({
      source: signal.source,
      landingLive: landingLiveFromRaw(signal.rawData),
    });
    return { signal, level, upcoming };
  });

  const rows =
    sat === "UPCOMING"
      ? withLevel.filter((row) => row.upcoming)
      : sat
        ? withLevel.filter((row) => row.level === sat)
        : withLevel;

  const countByStatus = Object.fromEntries(
    SIGNAL_STATUSES.map((item) => [
      item,
      counts.find((row) => row.status === item)?._count._all ?? 0,
    ]),
  ) as Record<SignalStatus, number>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <AdminTabs
        active={tab}
        reviewHref={`/admin?tab=review&status=${status}`}
      />

      {reprobeHealth.stale ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {t("reprobeStale")}{" "}
          {t("reprobePending")}: {reprobeHealth.pendingCount}
          {reprobeHealth.lastReprobeAt
            ? ` · ${t("reprobeLastRun")}: ${reprobeHealth.lastReprobeAt.toISOString()}`
            : ""}
        </div>
      ) : null}

      {tab === "review" ? (
        <Card>
          <CardHeader className="gap-4">
            <CardTitle className="text-base text-primary">{t("reviewTitle")}</CardTitle>
            <SaturationLegend
              activeKey={sat}
              hrefFor={(key) =>
                sat === key
                  ? `/admin?tab=review&status=${status}`
                  : `/admin?tab=review&status=${status}&sat=${key}`
              }
              labels={{
                saturationSaturated: t("saturationSaturated"),
                saturationWarning: t("saturationWarning"),
                saturationSafe: t("saturationSafe"),
                upcomingLaunch: t("upcomingLaunch"),
              }}
            />
            <div className="flex flex-wrap gap-2">
              {SIGNAL_STATUSES.map((item) => (
                <Link
                  key={item}
                  href={`/admin?tab=review&status=${item}`}
                  className={cn(
                    "rounded-md border px-2.5 py-1 text-xs",
                    status === item
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground",
                  )}
                >
                  {item} ({countByStatus[item]})
                </Link>
              ))}
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("noSignals")}</p>
            ) : (
              <table className="w-full min-w-[1080px] text-left text-sm">
                <thead className="text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="py-2 pr-4 font-medium">{t("colDomain")}</th>
                    <th className="py-2 pr-4 font-medium">{t("colNiche")}</th>
                    <th className="py-2 pr-4 font-medium">{t("colKeyword")}</th>
                    <th className="py-2 pr-4 font-medium">{t("colSource")}</th>
                    <th className="py-2 pr-4 font-medium">{t("countryHint")}</th>
                    <th className="py-2 pr-4 font-medium">{t("langHint")}</th>
                    <th className="py-2 pr-4 font-medium">{t("colConfidence")}</th>
                    <th className="py-2 pr-4 font-medium">{t("colSaturation")}</th>
                    <th className="py-2 pr-4 font-medium">{t("colRegistered")}</th>
                    <th className="py-2 pr-4 font-medium">{t("colDiscovered")}</th>
                    <th className="py-2 font-medium">{t("colActions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ signal, level, upcoming }) => (
                    <tr key={signal.id} className="border-b border-border/70">
                      <td className="py-3 pr-4 font-medium">
                        <Link
                          href={`/admin/signal/${signal.id}`}
                          className="text-primary hover:underline"
                        >
                          {signal.domain ?? signal.value}
                        </Link>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {signal.niche ?? "—"}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {signal.keyword ?? "—"}
                      </td>
                      <td className="py-3 pr-4">{signal.source}</td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {signal.countryHint ?? "—"}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {signal.langHint ?? "—"}
                      </td>
                      <td className="py-3 pr-4">{signal.confidence}</td>
                      <td className="py-3 pr-4">
                        <SignalTableSaturation
                          level={level}
                          upcoming={upcoming}
                          labels={{
                            saturated: t("saturationTableSaturated"),
                            moderate: t("saturationTableWarning"),
                            hot: t("saturationTableSafe"),
                            upcomingLaunch: t("upcomingLaunch"),
                          }}
                        />
                      </td>
                      <td className="py-3 pr-4 text-xs text-muted-foreground">
                        {formatRelativeTime(
                          registeredAtFromRaw(signal.rawData) ?? "",
                          locale,
                        ) || (upcoming ? t("launchPending") : "—")}
                      </td>
                      <td className="py-3 pr-4 text-xs text-muted-foreground">
                        {formatRelativeTime(signal.discoveredAt, locale) || "—"}
                      </td>
                      <td className="py-3">
                        <SignalReviewActions
                          signalId={signal.id}
                          canReview={REVIEWABLE.includes(signal.status)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-end">
            <RunCollectionButton />
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-primary">{t("sourcesTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="py-2 pr-4 font-medium">{t("colName")}</th>
                    <th className="py-2 pr-4 font-medium">{t("colStatus")}</th>
                    <th className="py-2 pr-4 font-medium">{t("colReliability")}</th>
                    <th className="py-2 pr-4 font-medium">{t("colLastRun")}</th>
                    <th className="py-2 font-medium">{t("colError")}</th>
                  </tr>
                </thead>
                <tbody>
                  {sources
                    .filter((source) =>
                      (Object.values(SOURCE_SLUGS) as string[]).includes(source.slug),
                    )
                    .map((source) => (
                    <tr key={source.id} className="border-b border-border/70">
                      <td className="py-3 pr-4">
                        <p className="font-medium">{source.name}</p>
                        <p className="text-xs text-muted-foreground">{source.slug}</p>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={statusVariant(source.status)}>{source.status}</Badge>
                      </td>
                      <td className="py-3 pr-4">{source.reliability}</td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {source.lastRunAt ? source.lastRunAt.toISOString() : t("never")}
                      </td>
                      <td className="py-3 text-destructive">{source.lastError ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
