import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { RadarLaunchCard, radarLaunchCardLabels } from "@/components/radar/radar-launch-card";
import { RadarShell } from "@/components/radar/radar-shell";
import { Card, CardContent } from "@/components/ui/card";
import { assertLocale } from "@/i18n/routing";
import { canSeeUpcomingLaunches } from "@/lib/auth/access";
import { getCurrentUser } from "@/lib/auth/session";
import { Link } from "@/i18n/navigation";
import { listFavoriteLaunchIds } from "@/lib/favorites/monitor";
import { listVerifiedRadarLaunches } from "@/lib/radar/list";
import { isPromisingGarimpo } from "@/lib/radar/promising";

type RadarPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ garimpo?: string }>;
};

export default async function RadarPage({ params, searchParams }: RadarPageProps) {
  const { locale } = await params;
  const garimpo = (await searchParams).garimpo === "1";
  setRequestLocale(assertLocale(locale));
  const t = await getTranslations("radar");
  const monitor = await getTranslations("monitorados");
  const common = await getTranslations("common");
  const format = await getFormatter();
  const user = await getCurrentUser();
  const [rows, favoriteIds] = await Promise.all([
    listVerifiedRadarLaunches({
      includeUpcoming: canSeeUpcomingLaunches(user),
    }),
    user ? listFavoriteLaunchIds(user.id) : Promise.resolve(new Set<string>()),
  ]);
  const empty = common("insufficientData");
  const formatAbsolute = (date: Date) =>
    format.dateTime(date, { dateStyle: "medium", timeStyle: "short" });
  const labels = radarLaunchCardLabels(t, {
    add: monitor("add"),
    remove: monitor("remove"),
    added: monitor("added"),
    removed: monitor("removed"),
  });
  const visible = garimpo
    ? rows.filter((row) =>
        isPromisingGarimpo({
          firstSeenAt: row.firstSeenAt,
          saturation: row.saturation,
          signalDates: row.signalDates,
        }),
      )
    : rows;

  return (
    <RadarShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#D4AF37]">{t("title")}</h1>
            <p className="mt-1 text-sm text-[#8BA3B8]">{t("subtitle")}</p>
          </div>
          <Link
            href={garimpo ? "/radar" : "/radar?garimpo=1"}
            className={
              garimpo
                ? "rounded-full bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-[#0B1C33]"
                : "rounded-full border border-[#D4AF37]/50 px-4 py-2 text-sm font-semibold text-[#D4AF37]"
            }
          >
            {t("garimpo")}
          </Link>
        </div>

        {visible.length === 0 ? (
          <Card className="border-[#1E3A5F] bg-[#12263F]/80 text-[#F5F7FA]">
            <CardContent className="pt-6">
              <p className="text-sm text-[#8BA3B8]">{garimpo ? t("garimpoEmpty") : empty}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {visible.map((row) => (
              <RadarLaunchCard
                key={row.id}
                row={row}
                locale={locale}
                favorited={favoriteIds.has(row.id)}
                empty={empty}
                formatAbsolute={formatAbsolute}
                labels={labels}
              />
            ))}
          </div>
        )}
      </div>
    </RadarShell>
  );
}
