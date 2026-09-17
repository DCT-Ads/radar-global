import { asJsonRecord, dateFromRawField } from "@/lib/signals/saturation";

const WHOIS_DATE_LABELS = [
  /creation\s*date/i,
  /registered\s*on/i,
  /registr(?:y|ar)\s*registration\s*date/i,
  /domain\s*registration\s*date/i,
  /registration\s*time/i,
  /created(?:\s*on)?/i,
];

const RDAP_REGISTRATION_ACTIONS = new Set([
  "registration",
  "registered",
]);

export function isUtcDateOnly(date: Date) {
  return (
    date.getUTCHours() === 0 &&
    date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0
  );
}

export function parseFlexibleDate(value: string): Date | null {
  const trimmed = value.trim().replace(/\.$/, "");
  if (!trimmed) {
    return null;
  }

  const iso = Date.parse(trimmed);
  if (!Number.isNaN(iso)) {
    return new Date(iso);
  }

  const dmy = trimmed.match(
    /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/,
  );
  if (dmy) {
    const day = Number(dmy[1]);
    const month = Number(dmy[2]);
    const year = Number(dmy[3]);
    const date = new Date(
      Date.UTC(year, month - 1, day, Number(dmy[4] ?? 0), Number(dmy[5] ?? 0), Number(dmy[6] ?? 0)),
    );
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
}

/** True when registeredAt is only the WhoisDS list day (UTC midnight), not a WHOIS Creation Date. */
export function isListDayStamp(date: Date, listDate: string | null | undefined) {
  if (!listDate || !isUtcDateOnly(date)) {
    return false;
  }
  return date.toISOString().slice(0, 10) === listDate;
}

export function parseRegisteredAtFromRdap(payload: unknown): Date | null {
  const record = asJsonRecord(payload);
  const events = record?.events;
  if (!Array.isArray(events)) {
    return null;
  }

  const dates = events
    .map((event) => asJsonRecord(event))
    .filter((event) => {
      const action = typeof event?.eventAction === "string" ? event.eventAction.toLowerCase() : "";
      return RDAP_REGISTRATION_ACTIONS.has(action);
    })
    .map((event) =>
      typeof event?.eventDate === "string" ? parseFlexibleDate(event.eventDate) : null,
    )
    .filter((date): date is Date => date instanceof Date);

  if (dates.length === 0) {
    return null;
  }
  return new Date(Math.min(...dates.map((date) => date.getTime())));
}

export function parseRegisteredAtFromWhois(text: string): Date | null {
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*([^:]+)\s*:\s*(.+)\s*$/);
    if (!match) {
      continue;
    }
    const label = match[1]?.trim() ?? "";
    const value = match[2]?.trim() ?? "";
    if (!WHOIS_DATE_LABELS.some((pattern) => pattern.test(label))) {
      continue;
    }
    const date = parseFlexibleDate(value);
    if (date) {
      return date;
    }
  }
  return null;
}

/** Prefer createdAt when discoveredAt is a WhoisDS list-day midnight stamp. */
export function effectiveDiscoveredAt(signal: {
  discoveredAt: Date;
  createdAt: Date;
}): Date {
  return isUtcDateOnly(signal.discoveredAt) ? signal.createdAt : signal.discoveredAt;
}

export function trustedRegisteredAtFromRaw(
  rawData: unknown,
  column?: Date | null,
): Date | null {
  if (column && !Number.isNaN(column.getTime())) {
    const raw = asJsonRecord(rawData);
    const listDate = typeof raw?.listDate === "string" ? raw.listDate : null;
    if (!isListDayStamp(column, listDate)) {
      return column;
    }
  }

  const raw = asJsonRecord(rawData);
  const date =
    dateFromRawField(raw, "registeredAt") ?? dateFromRawField(raw, "registered_at");
  if (!date) {
    return null;
  }
  const listDate = typeof raw?.listDate === "string" ? raw.listDate : null;
  if (isListDayStamp(date, listDate)) {
    return null;
  }
  return date;
}

export function resolveSignalTimelineDates(input: {
  existingDiscoveredAt?: Date | null;
  existingRegisteredAt?: Date | null;
  whoisRegisteredAt?: Date | null;
  listDate?: string | null;
  now?: Date;
}): { discoveredAt: Date; registeredAt: Date | null } {
  const discoveredAt = input.existingDiscoveredAt ?? input.now ?? new Date();
  const existing = input.existingRegisteredAt;
  const trustedExisting =
    existing && !isListDayStamp(existing, input.listDate) ? existing : null;
  return {
    discoveredAt,
    registeredAt: trustedExisting ?? input.whoisRegisteredAt ?? null,
  };
}

export async function fetchRdapRegisteredAt(
  domain: string,
  fetchFn: typeof fetch = fetch,
): Promise<Date | null> {
  const host = domain.trim().toLowerCase();
  if (!host) {
    return null;
  }

  try {
    const response = await fetchFn(`https://rdap.org/domain/${encodeURIComponent(host)}`, {
      headers: {
        Accept: "application/rdap+json, application/json",
        "User-Agent": "RadarGlobalBot/1.0 (rdap registration date)",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) {
      return null;
    }
    return parseRegisteredAtFromRdap(await response.json());
  } catch {
    return null;
  }
}
