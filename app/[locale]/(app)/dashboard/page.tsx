import { getTranslations, setRequestLocale } from "next-intl/server";
import { assertLocale } from "@/i18n/routing";
import { formatRelativeTime } from "@/lib/format/relative-time";
import { canSeeUpcomingLaunches } from "@/lib/auth/access";
import { getCurrentUser } from "@/lib/auth/session";
import { ChartCard } from "@/components/dashboard/chart-card";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { NicheBars } from "@/components/dashboard/niche-bars";
import { RecentSignals } from "@/components/dashboard/recent-signals";
import { SaturationDonut } from "@/components/dashboard/saturation-donut";
import { SignalsAreaChart } from "@/components/dashboard/signals-area-chart";
import {
  DASHBOARD_OTHERS_SOURCE,
  getDashboardStats,
} from "@/lib/dashboard/stats";

type DashboardPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { locale } = await params;
  setRequestLocale(assertLocale(locale));
  const t = await getTranslations("dashboard");
  const user = await getCurrentUser();
  const stats = await getDashboardStats();
  const empty = t("emptyChart");
  const emptySignals = t("emptySignals");
  const sourceBars = stats.signalsBySource.map((row) => ({
    ...row,
    label: row.label === DASHBOARD_OTHERS_SOURCE ? t("sourceOthers") : row.label,
  }));
  const saturationLabels = {
    hot: t("satHot"),
    moderate: t("satModerate"),
    saturated: t("satSaturated"),
    upcomingLaunch: t("kpiUpcoming"),
  };

  return (
    <div
      className="-m-6 min-h-[calc(100vh-3.5rem)] p-6 text-[#F5F7FA]"
      style={{
        background: "linear-gradient(180deg, #0B1A2F 0%, #12263F 100%)",
      }}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#D4AF37]">
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-[#8BA3B8]">
            {t("welcome", { name: user?.name ?? "" })}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label={t("kpiTotal")} value={stats.total} hint={t("kpiTotalHint")} />
          <KpiCard
            label={t("kpiHot")}
            value={stats.hot}
            hint={t("kpiHotHint")}
            accent="green"
          />
          {canSeeUpcomingLaunches(user) ? (
            <KpiCard
              label={t("kpiUpcoming")}
              value={stats.upcoming}
              hint={t("kpiUpcomingHint")}
              accent="blue"
            />
          ) : null}
          <KpiCard
            label={t("kpiVerified")}
            value={stats.verified}
            hint={t("kpiVerifiedHint")}
            accent="cyan"
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <ChartCard
            title={t("chartTimeline")}
            className="xl:col-span-2"
            empty={stats.timeline.every((point) => point.count === 0)}
            emptyLabel={empty}
          >
            <SignalsAreaChart data={stats.timeline} />
          </ChartCard>
          <ChartCard
            title={t("chartSaturation")}
            empty={stats.saturation.every((item) => item.count === 0)}
            emptyLabel={empty}
          >
            <SaturationDonut
              data={stats.saturation}
              labels={{
                SATURATED: t("satSaturated"),
                WARNING: t("satModerate"),
                SAFE: t("satHot"),
              }}
            />
          </ChartCard>
        </div>

        <ChartCard
          title={t("chartNiches")}
          empty={stats.niches.length === 0}
          emptyLabel={empty}
        >
          <NicheBars data={stats.niches} />
        </ChartCard>

        <div className="grid items-stretch gap-4 lg:grid-cols-3">
          <ChartCard
            title={t("chartSources")}
            className="h-full lg:col-span-2"
            empty={sourceBars.length === 0}
            emptyLabel={emptySignals}
          >
            <NicheBars data={sourceBars} />
          </ChartCard>
          <KpiCard
            label={t("kpiLast24h")}
            value={stats.last24h.count}
            hint={
              stats.last24h.count === 0
                ? emptySignals
                : stats.last24h.isNew || stats.last24h.deltaPct != null
                  ? undefined
                  : t("kpiLast24hHint")
            }
            deltaPct={stats.last24h.deltaPct}
            deltaLabel={t("kpiLast24hVs")}
            badge={stats.last24h.isNew ? t("kpiLast24hNew") : undefined}
            meta={
              stats.last24h.topSource
                ? `${stats.last24h.topSource.label} · ${stats.last24h.topSource.count.toLocaleString()}`
                : undefined
            }
            size="lg"
          />
        </div>

        <ChartCard
          title={t("chartRecent")}
          bodyClassName={
            stats.recentSignals.length === 0 ? "h-[160px]" : "h-auto"
          }
          empty={stats.recentSignals.length === 0}
          emptyLabel={emptySignals}
        >
          <RecentSignals
            labels={saturationLabels}
            rows={stats.recentSignals.map((signal) => ({
              ...signal,
              relative: formatRelativeTime(signal.createdAt, locale),
            }))}
          />
        </ChartCard>
      </div>
    </div>
  );
}
