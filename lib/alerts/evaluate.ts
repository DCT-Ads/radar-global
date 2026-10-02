import type { Locale } from "@/i18n/routing";

export type StageCode = "SAFE" | "WARNING" | "SATURATED";
export type AlertSensitivity = "ALL" | "HOT_ONLY";

export type WatchedLaunch = {
  launchId: string;
  title: string;
  niche: string | null;
  saturation: StageCode | null;
  earlySignal: number | null;
  lastSaturation: string | null;
  lastEarlySignal: number | null;
};

export type NoticeDraft = {
  dedupeKey: string;
  kind: "stage" | "growth" | "related" | "acceleration" | "garimpo";
  launchId: string;
  title: string;
  body: string;
  href: string;
  fromStage: string | null;
  toStage: string | null;
};

const STAGE_LABEL: Record<Locale, Record<StageCode | "none", string>> = {
  pt: { SAFE: "Hot", WARNING: "Moderado", SATURATED: "Saturado", none: "Sem leitura" },
  es: { SAFE: "Hot", WARNING: "Moderado", SATURATED: "Saturado", none: "Sin lectura" },
  en: { SAFE: "Hot", WARNING: "Moderate", SATURATED: "Saturated", none: "No reading" },
};

export function stageLabel(stage: string | null, locale: Locale) {
  const table = STAGE_LABEL[locale];
  if (stage === "SAFE" || stage === "WARNING" || stage === "SATURATED") return table[stage];
  return table.none;
}

function whyLine(niche: string | null, locale: Locale) {
  const name = niche?.trim() || "—";
  if (locale === "en") {
    return `Niche: ${name}. The stage comes from keyword volume and time since first detection. It is not a sales forecast.`;
  }
  if (locale === "es") {
    return `Nicho: ${name}. La etapa sale del volumen del término y del tiempo desde la primera detección. No es un pronóstico de ventas.`;
  }
  return `Nicho: ${name}. O estágio sai do volume do termo e do tempo desde a primeira detecção. Não é previsão de venda.`;
}

export function isStageCode(value: string | null | undefined): value is StageCode {
  return value === "SAFE" || value === "WARNING" || value === "SATURATED";
}

export function draftsForWatch(
  row: WatchedLaunch,
  sensitivity: AlertSensitivity,
  locale: Locale,
): NoticeDraft[] {
  const seenBefore = row.lastSaturation !== null || row.lastEarlySignal !== null;
  if (!seenBefore) return [];

  const drafts: NoticeDraft[] = [];
  const previous = isStageCode(row.lastSaturation) ? row.lastSaturation : null;
  const current = row.saturation;
  if (previous !== current && (previous || current)) {
    const toHot = current === "SAFE";
    if (sensitivity === "ALL" || toHot) {
      const fromLabel = stageLabel(previous, locale);
      const toLabel = stageLabel(current, locale);
      drafts.push({
        dedupeKey: `stage:${row.launchId}:${previous ?? "none"}:${current ?? "none"}`,
        kind: "stage",
        launchId: row.launchId,
        title: row.title,
        body: `${fromLabel} → ${toLabel}. ${whyLine(row.niche, locale)}`,
        href: `/launches/${row.launchId}`,
        fromStage: previous,
        toStage: current,
      });
    }
  }

  const before = row.lastEarlySignal;
  const after = row.earlySignal;
  if (
    before !== null &&
    after !== null &&
    before > 0 &&
    after - before >= 8 &&
    (after - before) / before >= 0.25 &&
    (sensitivity === "ALL" || current === "SAFE")
  ) {
    const pct = Math.round(((after - before) / before) * 100);
    const jump =
      locale === "en"
        ? `Early Signal moved from ${before} to ${after} (${pct}%).`
        : locale === "es"
          ? `Early Signal pasó de ${before} a ${after} (${pct}%).`
          : `Early Signal foi de ${before} para ${after} (${pct}%).`;
    drafts.push({
      dedupeKey: `growth:${row.launchId}:${before}:${after}`,
      kind: "growth",
      launchId: row.launchId,
      title: row.title,
      body: `${jump} ${whyLine(row.niche, locale)}`,
      href: `/launches/${row.launchId}`,
      fromStage: previous,
      toStage: current,
    });
  }

  return drafts;
}

export function relatedDraft(input: {
  launchId: string;
  title: string;
  niche: string;
  locale: Locale;
}): NoticeDraft {
  const body =
    input.locale === "en"
      ? `New signal in ${input.niche}, a niche you already watch.`
      : input.locale === "es"
        ? `Señal nueva en ${input.niche}, un nicho que ya monitorizas.`
        : `Sinal novo em ${input.niche}, nicho que você já monitora.`;
  return {
    dedupeKey: `related:${input.launchId}`,
    kind: "related",
    launchId: input.launchId,
    title: input.title,
    body,
    href: `/launches/${input.launchId}`,
    fromStage: null,
    toStage: null,
  };
}

export function zonedClock(date: Date, timeZone: string) {
  const zone = timeZone || "America/Sao_Paulo";
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
    }).formatToParts(date);
    const read = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
    let hour = Number(read("hour"));
    if (!Number.isFinite(hour) || hour === 24) hour = 0;
    return { hour, dayKey: `${read("year")}-${read("month")}-${read("day")}` };
  } catch {
    if (zone !== "America/Sao_Paulo") return zonedClock(date, "America/Sao_Paulo");
    return { hour: date.getUTCHours(), dayKey: date.toISOString().slice(0, 10) };
  }
}

export function quietDue(sentAt: Date | null, now: Date) {
  if (!sentAt) return true;
  return now.getTime() - sentAt.getTime() >= 7 * 24 * 60 * 60 * 1000;
}

/** Dia calmo só existe no resumo diário do Premium, e no máximo uma vez por semana. */
export function shouldSendQuietDigest(input: {
  premium: boolean;
  digestEnabled: boolean;
  hasNews: boolean;
  quietIsDue: boolean;
}) {
  return input.premium && input.digestEnabled && !input.hasNews && input.quietIsDue;
}
