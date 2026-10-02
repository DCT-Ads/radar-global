import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { RadarLaunchCard, radarLaunchCardLabels } from "@/components/radar/radar-launch-card";
import { RadarShell } from "@/components/radar/radar-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { assertLocale } from "@/i18n/routing";
import { getCurrentUser } from "@/lib/auth/session";
import { listMonitoredLaunches } from "@/lib/favorites/monitor";
import { formatRelativeTime } from "@/lib/format/relative-time";

type MonitoradosPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function MonitoradosPage({ params }: MonitoradosPageProps) {
  const { locale } = await params;
  setRequestLocale(assertLocale(locale));
  const t = await getTranslations("monitorados");
  const radar = await getTranslations("radar");
  const common = await getTranslations("common");
  const format = await getFormatter();
  const user = await getCurrentUser();
  const rows = user ? await listMonitoredLaunches(user.id) : [];
  const empty = common("insufficientData");
  const formatAbsolute = (date: Date) =>
    format.dateTime(date, { dateStyle: "medium", timeStyle: "short" });
  const labels = radarLaunchCardLabels(radar, {
    add: t("add"),
    remove: t("remove"),
    added: t("added"),
    removed: t("removed"),
  });

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
              <p className="text-sm text-[#8BA3B8]">{t("empty")}</p>
              <Link
                href="/radar"
                className="mt-3 inline-block text-sm font-medium text-[#00C2CB] hover:underline"
              >
                {t("goToRadar")}
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {rows.map((row) => (
              <RadarLaunchCard
                key={row.id}
                row={row}
                locale={locale}
                favorited
                empty={empty}
                formatAbsolute={formatAbsolute}
                labels={labels}
                extra={
                  <>
                    <p className="text-xs text-[#8BA3B8]">
                      {t("savedAt")}:{" "}
                      {formatRelativeTime(row.favoritedAt, locale) || formatAbsolute(row.favoritedAt)}
                    </p>
                    {row.changedThisWeek ? (
                      <p className="text-xs font-medium text-[#D4AF37]">{t("updatedThisWeek")}</p>
                    ) : row.changedSinceSave ? (
                      <p className="text-xs font-medium text-[#00C2CB]">{t("updatedSinceSave")}</p>
                    ) : (
                      <p className="text-xs text-[#8BA3B8]">{t("noChange")}</p>
                    )}
                  </>
                }
              />
            ))}
          </div>
        )}
      </div>
    </RadarShell>
  );
}
