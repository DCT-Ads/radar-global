import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { SignalTableSaturation } from "@/components/admin/signal-table-saturation";
import { RadarShell } from "@/components/radar/radar-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { assertLocale } from "@/i18n/routing";
import { canSeeUpcomingLaunches } from "@/lib/auth/access";
import { getCurrentUser } from "@/lib/auth/session";
import { formatRelativeTime } from "@/lib/format/relative-time";
import { listVerifiedRadarLaunches } from "@/lib/radar/list";

type RadarPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function RadarPage({ params }: RadarPageProps) {
  const { locale } = await params;
  setRequestLocale(assertLocale(locale));
  const t = await getTranslations("radar");
  const common = await getTranslations("common");
  const format = await getFormatter();
  const user = await getCurrentUser();
  const rows = await listVerifiedRadarLaunches({
    includeUpcoming: canSeeUpcomingLaunches(user),
  });
  const empty = common("insufficientData");
  const formatAbsolute = (date: Date) =>
    format.dateTime(date, { dateStyle: "medium", timeStyle: "short" });

  return (
    <RadarShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#D4AF37]">{t("title")}</h1>
          <p className="mt-1 text-sm text-[#8BA3B8]">{t("subtitle")}</p>
        </div>

        {rows.length === 0 ? (
          <Card className="border-[#1E3A5F] bg-[#12263F]/80 text-[#F5F7FA]">
            <CardContent className="pt-6">
              <p className="text-sm text-[#8BA3B8]">{empty}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {rows.map((row) => (
              <Card
                key={row.id}
                className="border-[#1E3A5F] bg-[#12263F]/80 text-[#F5F7FA]"
              >
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
                  </div>
                  <SignalTableSaturation
                    level={row.saturation}
                    upcoming={row.upcoming}
                    labels={{
                      saturated: t("satSaturated"),
                      moderate: t("satWarning"),
                      hot: t("satSafe"),
                      upcomingLaunch: t("upcoming"),
                    }}
                  />
                </CardHeader>
                <CardContent className="flex flex-wrap items-end justify-between gap-4">
                  <div className="flex gap-6">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-[#8BA3B8]">
                        {t("earlySignal")}
                      </p>
                      <p className="text-2xl font-semibold text-[#F5F7FA]">
                        {row.earlySignal == null ? empty : row.earlySignal}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-[#8BA3B8]">
                        {t("firstSeen")}
                      </p>
                      <p className="text-sm text-[#F5F7FA]">
                        {formatRelativeTime(row.firstSeenAt, locale) || empty}
                      </p>
                      <p className="text-xs text-[#8BA3B8]">{formatAbsolute(row.firstSeenAt)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-[#8BA3B8]">
                        {t("evidence")}
                      </p>
                      <p className="text-sm text-[#F5F7FA]">{row.evidenceCount}</p>
                    </div>
                  </div>
                  <Link
                    href={`/launches/${row.id}`}
                    className="text-sm font-medium text-[#00C2CB] hover:underline"
                  >
                    {t("openLaunch")}
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </RadarShell>
  );
}
