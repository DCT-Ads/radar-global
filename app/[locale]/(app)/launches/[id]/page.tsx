import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { SignalTableSaturation } from "@/components/admin/signal-table-saturation";
import { ProducerContactCard } from "@/components/radar/producer-contact-card";
import { RadarShell } from "@/components/radar/radar-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { assertLocale } from "@/i18n/routing";
import { canSeeUpcomingLaunches } from "@/lib/auth/access";
import { getCurrentUser } from "@/lib/auth/session";
import { persistLaunchScore } from "@/lib/scoring/persist";
import { formatAffiliateCommission, getRadarLaunch } from "@/lib/radar/detail";
import { redirect } from "@/i18n/navigation";

type LaunchPageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function LaunchPage({ params }: LaunchPageProps) {
  const { locale: rawLocale, id } = await params;
  const locale = assertLocale(rawLocale);
  setRequestLocale(locale);
  const t = await getTranslations("radar");
  const common = await getTranslations("common");
  const format = await getFormatter();
  const detail = await getRadarLaunch(id);

  if (!detail) {
    notFound();
  }

  const user = await getCurrentUser();
  if (detail.upcoming && !canSeeUpcomingLaunches(user)) {
    redirect({ href: "/upgrade", locale });
  }

  await persistLaunchScore(detail.launch.id);

  const empty = common("insufficientData");
  const { launch, scored, saturation, upcoming, contact } = detail;
  const formatDate = (date: Date | null | undefined) =>
    date ? format.dateTime(date, { dateStyle: "medium", timeStyle: "short" }) : empty;

  return (
    <RadarShell>
      <div className="space-y-6">
        <div className="space-y-3">
          <Link href="/radar" className="text-sm text-[#8BA3B8] hover:text-[#D4AF37]">
            ← {t("backToRadar")}
          </Link>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-[#D4AF37]">
                {launch.title}
              </h1>
              <p className="mt-1 text-sm text-[#8BA3B8]">{launch.domain}</p>
              <p className="mt-2 text-sm text-[#F5F7FA]">
                {t("producer")}:{" "}
                <Link
                  href={`/producers/${launch.producer.id}`}
                  className="text-[#00C2CB] hover:underline"
                >
                  {launch.producer.name}
                </Link>
              </p>
            </div>
            <SignalTableSaturation
              level={saturation}
              upcoming={upcoming}
              labels={{
                saturated: t("satSaturated"),
                moderate: t("satWarning"),
                hot: t("satSafe"),
                upcomingLaunch: t("upcoming"),
              }}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border-[#1E3A5F] bg-[#12263F]/80 text-[#F5F7FA]">
            <CardHeader>
              <CardTitle className="text-sm text-[#8BA3B8]">{t("earlySignal")}</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-semibold">
              {scored.earlySignal == null ? empty : scored.earlySignal}
            </CardContent>
          </Card>
          <Card className="border-[#1E3A5F] bg-[#12263F]/80 text-[#F5F7FA]">
            <CardHeader>
              <CardTitle className="text-sm text-[#8BA3B8]">{t("dataQuality")}</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-semibold">
              {scored.dataQuality == null ? empty : scored.dataQuality}
            </CardContent>
          </Card>
          <Card className="border-[#1E3A5F] bg-[#12263F]/80 text-[#F5F7FA]">
            <CardHeader>
              <CardTitle className="text-sm text-[#8BA3B8]">{t("firstSeen")}</CardTitle>
            </CardHeader>
            <CardContent className="text-lg">{formatDate(launch.firstSeenAt)}</CardContent>
          </Card>
        </div>

        <ProducerContactCard
          contact={contact}
          commission={formatAffiliateCommission(launch.commissions[0])}
          labels={{
            title: t("contactTitle"),
            empty,
            ease: t("contactEase"),
            commission: t("contactCommission"),
            notInformed: t("contactNotInformed"),
            linkedin: t("contactLinkedin"),
            youtube: t("contactYoutube"),
            facebook: t("contactFacebook"),
            x: t("contactX"),
            company: t("contactCompany"),
          }}
        />

        <Card className="border-[#1E3A5F] bg-[#12263F]/80 text-[#F5F7FA]">
          <CardHeader>
            <CardTitle className="text-base text-[#D4AF37]">{t("evidence")}</CardTitle>
          </CardHeader>
          <CardContent>
            {launch.evidences.length === 0 ? (
              <p className="text-sm text-[#8BA3B8]">{empty}</p>
            ) : (
              <ul className="space-y-4">
                {launch.evidences.map((evidence) => (
                  <li key={evidence.id} className="border-b border-[#1E3A5F] pb-3 last:border-0">
                    <p className="font-medium">{evidence.title ?? evidence.source.name}</p>
                    <a
                      href={evidence.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-[#00C2CB] hover:underline"
                    >
                      {evidence.url}
                    </a>
                    <p className="mt-1 text-xs text-[#8BA3B8]">
                      {evidence.source.name} · {evidence.type} · {formatDate(evidence.capturedAt)}
                    </p>
                    {evidence.snippet ? (
                      <p className="mt-1 text-sm text-[#8BA3B8]">{evidence.snippet}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </RadarShell>
  );
}
