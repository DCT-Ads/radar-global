import type { Prisma, SignalStatus } from "@prisma/client";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { SignalEnrichmentStepper } from "@/components/admin/signal-enrichment-stepper";
import { SignalReviewActions } from "@/components/admin/signal-review-actions";
import { SaturationLegend } from "@/components/admin/saturation-legend";
import { SignalStatusBadge } from "@/components/admin/signal-status-badge";
import { ProducerContactCard } from "@/components/radar/producer-contact-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { assertLocale } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { contactFromRecords, formatAffiliateCommission } from "@/lib/radar/detail";
import { enrichProducerById, isProducerEnrichmentDue } from "@/lib/producers/enrich";
import {
  getSaturationLevel,
  isUpcomingLaunch,
  landingLiveFromRaw,
  launchAtFromRaw,
  registeredAtFromRaw,
  saturationInputsForSignal,
} from "@/lib/signals/saturation";

const REVIEWABLE: SignalStatus[] = ["NEW", "ENRICHING", "CANDIDATE"];

type SignalDetailPageProps = {
  params: Promise<{ locale: string; id: string }>;
};

function asRecord(value: Prisma.JsonValue | null): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function Field({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm">{value === 0 || value ? String(value) : "—"}</p>
    </div>
  );
}

export default async function SignalDetailPage({ params }: SignalDetailPageProps) {
  const { locale, id } = await params;
  setRequestLocale(assertLocale(locale));
  const t = await getTranslations("admin");
  const radar = await getTranslations("radar");
  const format = await getFormatter();

  const signal = await prisma.signal.findUnique({
    where: { id },
    include: {
      producer: { include: { country: true, evidences: true } },
      launch: {
        include: {
          country: true,
          producer: { include: { evidences: true } },
          commissions: { orderBy: { capturedAt: "desc" }, take: 1 },
          evidences: true,
        },
      },
      evidences: {
        include: { source: true },
        orderBy: { capturedAt: "desc" },
      },
    },
  });

  if (!signal) {
    notFound();
  }

  const producerId = signal.producerId ?? signal.launch?.producerId;
  const producerRecord = signal.producer ?? signal.launch?.producer ?? null;
  if (producerId && isProducerEnrichmentDue(producerRecord?.enrichedAt)) {
    const enriched = await enrichProducerById(producerId);
    if (enriched && producerRecord) {
      Object.assign(producerRecord, enriched);
    }
  }

  const saturationInputs = await saturationInputsForSignal(signal);
  const domain = signal.domain ?? signal.value;
  const raw = asRecord(signal.rawData);
  const issuedAt =
    typeof raw.issuedAt === "string" && !Number.isNaN(Date.parse(raw.issuedAt))
      ? new Date(raw.issuedAt)
      : null;
  const registeredAt =
    registeredAtFromRaw(signal.rawData) ?? signal.discoveredAt;
  const upcoming = isUpcomingLaunch({
    source: signal.source,
    landingLive: landingLiveFromRaw(signal.rawData),
  });
  const launchAt = upcoming
    ? null
    : (launchAtFromRaw(signal.rawData) ?? signal.discoveredAt);
  const awaiting = t("awaitingEnrichment");
  const formatDate = (date: Date | null | undefined) =>
    date
      ? format.dateTime(date, { dateStyle: "medium", timeStyle: "short" })
      : "—";
  const contact = contactFromRecords({
    ...(producerRecord ?? {}),
    name: producerRecord?.name ?? domain,
    domain,
    website: producerRecord?.website ?? (domain ? `https://${domain}` : null),
    evidences: [
      ...signal.evidences,
      ...(producerRecord?.evidences ?? []),
      ...(signal.launch?.evidences ?? []),
    ],
    extras: [{ url: signal.url, raw: signal.rawData }],
  });
  const commission = formatAffiliateCommission(signal.launch?.commissions[0]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <Link href="/admin" className="text-sm text-muted-foreground hover:text-primary">
            ← {t("backToQueue")}
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight text-primary">{domain}</h1>
            <SignalStatusBadge status={signal.status} />
            <SaturationLegend
              activeKey={upcoming ? "UPCOMING" : getSaturationLevel(saturationInputs)}
              labels={{
                saturationSaturated: t("saturationSaturated"),
                saturationWarning: t("saturationWarning"),
                saturationSafe: t("saturationSafe"),
                upcomingLaunch: t("upcomingLaunch"),
              }}
            />
          </div>
          {signal.url ? (
            <a
              href={signal.url}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-muted-foreground hover:text-primary"
            >
              {signal.url}
            </a>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin"
            className="inline-flex h-8 items-center rounded-md border border-border px-3 text-xs"
          >
            {t("back")}
          </Link>
          <SignalReviewActions
            signalId={signal.id}
            canReview={REVIEWABLE.includes(signal.status)}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base text-primary">{t("enrichmentFlow")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <SignalEnrichmentStepper status={signal.status} />
          {signal.status === "DISCARDED" ? (
            <p className="text-sm text-destructive">{t("discardedNote")}</p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base text-primary">{t("signalData")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label={t("colNiche")} value={signal.niche} />
          <Field label={t("colKeyword")} value={signal.keyword} />
          <Field label={t("colSource")} value={signal.source} />
          <Field label={t("colConfidence")} value={signal.confidence} />
          <Field label={t("competitorCount")} value={saturationInputs.keywordVolume} />
          <Field
            label={t("firstSeenDaysAgo")}
            value={Math.max(0, Math.round(saturationInputs.firstSeenDaysAgo))}
          />
          <Field label={t("countryHint")} value={signal.countryHint} />
          <Field label={t("langHint")} value={signal.langHint} />
          <Field label={t("colDiscovered")} value={formatDate(signal.discoveredAt)} />
          <Field label={t("colRegistered")} value={formatDate(registeredAt)} />
          <Field
            label={t("colLaunchAt")}
            value={upcoming ? t("launchPending") : formatDate(launchAt)}
          />
          <Field label={t("certIssuedAt")} value={formatDate(issuedAt)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base text-primary">{t("statusTimeline")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">{t("colDiscovered")}: </span>
            {formatDate(signal.discoveredAt)}
          </p>
          <p>
            <span className="text-muted-foreground">{t("createdInSystem")}: </span>
            {formatDate(signal.createdAt)}
          </p>
          <p>
            <span className="text-muted-foreground">{t("updatedAt")}: </span>
            {formatDate(signal.updatedAt)}
          </p>
          <p>
            <span className="text-muted-foreground">{t("verifiedAt")}: </span>
            {signal.verifiedAt ? formatDate(signal.verifiedAt) : awaiting}
          </p>
          <p className="text-xs text-muted-foreground">{t("noStatusHistory")}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base text-primary">{t("producerLaunch")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {signal.producerId ? (
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {t("producerName")}
              </p>
              <Link
                href={`/producers/${signal.producerId}`}
                className="text-sm text-primary hover:underline"
              >
                {signal.producer?.name ?? signal.producerId}
              </Link>
            </div>
          ) : (
            <Field
              label={t("producerName")}
              value={signal.producer?.name ?? signal.launch?.producer.name}
            />
          )}
          <Field
            label={t("producerWebsite")}
            value={signal.producer?.website}
          />
          <Field
            label={t("producerCountry")}
            value={
              signal.producer?.country?.name ??
              signal.launch?.country?.name ??
              signal.countryHint
            }
          />
          {signal.launchId ? (
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {t("launchTitle")}
              </p>
              <Link
                href={`/launches/${signal.launchId}`}
                className="text-sm text-primary hover:underline"
              >
                {signal.launch?.title ?? signal.launchId}
              </Link>
            </div>
          ) : (
            <Field label={t("launchTitle")} value={signal.launch?.title} />
          )}
          <Field label={t("launchStatus")} value={signal.launch?.status} />
          <Field label={t("whoisRegistrar")} value={awaiting} />
          <Field
            label={t("whoisCreated")}
            value={formatDate(registeredAt)}
          />
          <Field label={t("whoisExpires")} value={awaiting} />
          <Field label={t("technologies")} value={awaiting} />
        </CardContent>
      </Card>

      <ProducerContactCard
        contact={contact}
        commission={commission}
        labels={{
          title: radar("contactTitle"),
          empty: t("awaitingEnrichment"),
          ease: radar("contactEase"),
          commission: radar("contactCommission"),
          notInformed: radar("contactNotInformed"),
          linkedin: radar("contactLinkedin"),
          youtube: radar("contactYoutube"),
          facebook: radar("contactFacebook"),
          x: radar("contactX"),
          company: radar("contactCompany"),
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base text-primary">{t("evidenceList")}</CardTitle>
        </CardHeader>
        <CardContent>
          {signal.evidences.length === 0 ? (
            <p className="text-sm text-muted-foreground">{awaiting}</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {signal.evidences.map((evidence) => (
                <li key={evidence.id} className="border-b border-border/60 pb-3 last:border-0">
                  <p className="font-medium">{evidence.source.name}</p>
                  <a
                    href={evidence.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline"
                  >
                    {evidence.url}
                  </a>
                  <p className="text-xs text-muted-foreground">
                    {evidence.type} · {formatDate(evidence.capturedAt)} · {evidence.confidence}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
