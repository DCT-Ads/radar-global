import {
  asJsonRecord,
  dateFromRawField,
  launchAtFromRaw,
} from "@/lib/signals/saturation";

export function isUtcDateOnly(date: Date) {
  return (
    date.getUTCHours() === 0 &&
    date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0
  );
}

export function firstSeenAtFromSignal(signal: {
  discoveredAt: Date;
  rawData: unknown;
}) {
  const raw = asJsonRecord(signal.rawData);
  const landing = asJsonRecord(asJsonRecord(raw?.httpProbe)?.landing);
  const precise = [
    dateFromRawField(raw, "issuedAt"),
    launchAtFromRaw(signal.rawData),
    dateFromRawField(landing, "probedAt"),
    isUtcDateOnly(signal.discoveredAt) ? null : signal.discoveredAt,
  ].filter((value): value is Date => value instanceof Date);

  if (precise.length > 0) {
    return new Date(Math.min(...precise.map((value) => value.getTime())));
  }

  return signal.discoveredAt;
}

export function firstSeenAtFromLaunch(input: {
  firstSeenAt: Date;
  signals: Array<{ discoveredAt: Date; rawData: unknown }>;
}) {
  const fromSignals = input.signals.map(firstSeenAtFromSignal);
  const precise = [...fromSignals, input.firstSeenAt].filter(
    (value) => !isUtcDateOnly(value),
  );
  if (precise.length > 0) {
    return new Date(Math.min(...precise.map((value) => value.getTime())));
  }
  return new Date(
    Math.min(
      input.firstSeenAt.getTime(),
      ...fromSignals.map((value) => value.getTime()),
    ),
  );
}

export function uniqueEvidenceCount(
  launchEvidences: Array<{ id: string }>,
  signalEvidences: Array<{ id: string }>,
) {
  return new Set([
    ...launchEvidences.map((evidence) => evidence.id),
    ...signalEvidences.map((evidence) => evidence.id),
  ]).size;
}
