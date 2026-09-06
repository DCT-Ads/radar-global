const UNITS = [
  { unit: "year", seconds: 31536000 },
  { unit: "month", seconds: 2592000 },
  { unit: "week", seconds: 604800 },
  { unit: "day", seconds: 86400 },
  { unit: "hour", seconds: 3600 },
  { unit: "minute", seconds: 60 },
  { unit: "second", seconds: 1 },
] as const;

function toDate(value: Date | string): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

export function formatRelativeTime(
  value: Date | string,
  locale: string,
  now: Date = new Date(),
): string {
  const date = toDate(value);
  if (!date) {
    return "";
  }

  const deltaSeconds = (date.getTime() - now.getTime()) / 1000;
  const abs = Math.abs(deltaSeconds);
  const bucket = UNITS.find((item) => abs >= item.seconds) ?? UNITS[UNITS.length - 1];
  const amount = Math.round(deltaSeconds / bucket.seconds);

  if (amount === 0) {
    return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(
      0,
      "second",
    );
  }

  return new Intl.RelativeTimeFormat(locale, { numeric: "always" }).format(
    amount,
    bucket.unit,
  );
}
