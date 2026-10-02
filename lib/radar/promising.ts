import type { SaturationLevel } from "@/lib/signals/saturation";

/** Primeiro sinal com pelo menos 3 dias e no máximo 7. */
export const PROMISING_MIN_AGE_DAYS = 3;
export const PROMISING_MAX_AGE_DAYS = 7;

/**
 * Crescimento mínimo entre o penúltimo e o último dia com sinais.
 * 3 = +300%. Ajuste só esta constante.
 */
export const PROMISING_ACCELERATION_MIN = 3;

export function signalDayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

/** Contagem por dia, do mais antigo ao mais recente. Dias sem sinal não entram. */
export function signalCountSeries(dates: Date[]) {
  const counts = new Map<string, number>();
  for (const date of dates) {
    const key = signalDayKey(date);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((left, right) => left[0].localeCompare(right[0]))
    .map(([day, count]) => ({ day, count }));
}

/** Variação (último - penúltimo) / penúltimo. Sem dois pontos, ou penúltimo zero, não há leitura. */
export function accelerationRatio(series: { count: number }[]) {
  if (series.length < 2) return null;
  const previous = series[series.length - 2]?.count ?? 0;
  const latest = series[series.length - 1]?.count ?? 0;
  if (previous <= 0) return null;
  return (latest - previous) / previous;
}

export function isHighAcceleration(ratio: number | null, minimum = PROMISING_ACCELERATION_MIN) {
  return ratio !== null && ratio >= minimum;
}

export function isPromisingAge(firstSeenAt: Date, now = new Date()) {
  const age = (now.getTime() - firstSeenAt.getTime()) / 86_400_000;
  return age >= PROMISING_MIN_AGE_DAYS && age <= PROMISING_MAX_AGE_DAYS;
}

export function isPromisingGarimpo(input: {
  firstSeenAt: Date;
  saturation: SaturationLevel | null;
  signalDates: Date[];
  now?: Date;
}) {
  const series = signalCountSeries(input.signalDates);
  return (
    isPromisingAge(input.firstSeenAt, input.now) &&
    input.saturation === "SAFE" &&
    isHighAcceleration(accelerationRatio(series))
  );
}

export function acceleratingPair(dates: Date[]) {
  const series = signalCountSeries(dates);
  const ratio = accelerationRatio(series);
  if (!isHighAcceleration(ratio) || series.length < 2) return null;
  const previous = series[series.length - 2];
  const latest = series[series.length - 1];
  if (!previous || !latest || ratio === null) return null;
  return { previousDay: previous.day, latestDay: latest.day, ratio };
}
