import { asJsonRecord } from "@/lib/signals/saturation";
import { cleanPublicName } from "@/lib/text/public-name";

const GENERIC = new Set([
  "verified public signal",
  "verified youtube signal",
]);

const JUNK_TITLE =
  /^(home|welcome|index|untitled|just a moment(\.\.\.)?|attention required!?|access denied|403|404|error)$/i;

function cleanTitle(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const title = cleanPublicName(value);
  if (title.length < 2 || title.length > 160) {
    return null;
  }
  if (GENERIC.has(title.toLowerCase()) || JUNK_TITLE.test(title)) {
    return null;
  }
  return title;
}

function looksLikeDomain(name: string, domain: string) {
  const normalized = name.toLowerCase();
  const host = domain.toLowerCase().replace(/^www\./, "");
  const stem = host.split(".")[0] ?? "";
  return (
    normalized === host ||
    normalized === `www.${host}` ||
    normalized === stem ||
    normalized.startsWith("youtube.com/watch")
  );
}

function titlesFromRaw(raw: unknown): string[] {
  const record = asJsonRecord(raw);
  const landing = asJsonRecord(asJsonRecord(record?.httpProbe)?.landing);
  return [
    cleanTitle(landing?.title),
    cleanTitle(record?.title),
    cleanTitle(record?.headline),
    cleanTitle(record?.product_name),
    cleanTitle(record?.productName),
    cleanTitle(record?.ogTitle),
  ].filter((value): value is string => Boolean(value));
}

export function productNameFromPublicSources(input: {
  upcoming: boolean;
  domain: string;
  launchTitle: string;
  evidences: Array<{ title?: string | null; raw?: unknown }>;
  signals: Array<{ rawData?: unknown }>;
}): string | null {
  if (input.upcoming) {
    return null;
  }

  const candidates = [
    ...input.signals.flatMap((signal) => titlesFromRaw(signal.rawData)),
    ...input.evidences.flatMap((evidence) => [
      cleanTitle(evidence.title),
      ...titlesFromRaw(evidence.raw),
    ]),
    cleanTitle(input.launchTitle),
  ].filter((value): value is string => Boolean(value));

  return (
    candidates.find((name) => !looksLikeDomain(name, input.domain)) ?? null
  );
}
