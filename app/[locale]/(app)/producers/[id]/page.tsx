import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { ProducerContactCard } from "@/components/radar/producer-contact-card";
import { RadarShell } from "@/components/radar/radar-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { assertLocale } from "@/i18n/routing";
import { canSeeUpcomingLaunches } from "@/lib/auth/access";
import { getCurrentUser } from "@/lib/auth/session";
import { getRadarProducer } from "@/lib/radar/detail";
import { isUpcomingLaunch, landingLiveFromRaw } from "@/lib/signals/saturation";

type ProducerPageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function ProducerPage({ params }: ProducerPageProps) {
  const { locale, id } = await params;
  setRequestLocale(assertLocale(locale));
  const t = await getTranslations("radar");
  const common = await getTranslations("common");
  const format = await getFormatter();
  const producer = await getRadarProducer(id);
  const user = await getCurrentUser();

  if (!producer) {
    notFound();
  }

  const empty = common("insufficientData");
  const launches = canSeeUpcomingLaunches(user)
    ? producer.launches
    : producer.launches.filter(
        (launch) =>
          !launch.signals.some((signal) =>
            isUpcomingLaunch({
              source: signal.source,
              landingLive: landingLiveFromRaw(signal.rawData),
            }),
          ),
      );
  const formatDate = (date: Date | null | undefined) =>
    date ? format.dateTime(date, { dateStyle: "medium", timeStyle: "short" }) : empty;

  return (
    <RadarShell>
      <div className="space-y-6">
        <div className="space-y-3">
          <Link href="/radar" className="text-sm text-[#8BA3B8] hover:text-[#D4AF37]">
            ← {t("backToRadar")}
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight text-[#D4AF37]">
            {producer.contact.companyName ?? producer.name}
          </h1>
          <p className="text-sm text-[#8BA3B8]">{producer.domain}</p>
          {producer.website ? (
            <a
              href={producer.website}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-[#00C2CB] hover:underline"
            >
              {producer.website}
            </a>
          ) : null}
        </div>

        <ProducerContactCard
          contact={producer.contact}
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
            <CardTitle className="text-base text-[#D4AF37]">{t("launches")}</CardTitle>
          </CardHeader>
          <CardContent>
            {launches.length === 0 ? (
              <p className="text-sm text-[#8BA3B8]">{empty}</p>
            ) : (
              <ul className="space-y-3">
                {launches.map((launch) => (
                  <li key={launch.id}>
                    <Link
                      href={`/launches/${launch.id}`}
                      className="font-medium text-[#00C2CB] hover:underline"
                    >
                      {launch.title}
                    </Link>
                    <p className="text-xs text-[#8BA3B8]">
                      {launch.domain}
                      {launch.niche ? ` · ${launch.niche}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-[#1E3A5F] bg-[#12263F]/80 text-[#F5F7FA]">
          <CardHeader>
            <CardTitle className="text-base text-[#D4AF37]">{t("evidence")}</CardTitle>
          </CardHeader>
          <CardContent>
            {producer.evidences.length === 0 ? (
              <p className="text-sm text-[#8BA3B8]">{empty}</p>
            ) : (
              <ul className="space-y-4">
                {producer.evidences.map((evidence) => (
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
