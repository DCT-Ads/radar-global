export type ParkingLanding = {
  title?: string | null;
  bodySnippet?: string | null;
  body?: string | null;
  html?: string | null;
};

export const THIN_BODY_MIN_CHARS = 200;

const PARKING_PHRASES = [
  "domain for sale",
  "buy this domain",
  "this domain is for sale",
  "sedoparking",
  "godaddy",
  "hugedomains",
  "coming soon",
  "under construction",
  "domínio pode estar à venda",
  "dominio pode estar a venda",
  "domínio à venda",
  "dominio a venda",
] as const;

export function usefulBodyText(raw: string): string {
  return raw
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#?\w+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function snippetOf(landing: ParkingLanding): string {
  return landing.bodySnippet ?? landing.body ?? landing.html ?? "";
}

function haystack(landing: ParkingLanding): string {
  return usefulBodyText(`${landing.title ?? ""} ${snippetOf(landing)}`).toLowerCase();
}

function matchedPhrase(text: string): string | null {
  for (const phrase of PARKING_PHRASES) {
    if (text.includes(phrase)) {
      return phrase;
    }
  }
  if (/\bparked\b/i.test(text)) {
    return "parked";
  }
  return null;
}

export function inspectParking(landing: ParkingLanding): {
  parked: boolean;
  reason: string | null;
} {
  const title = usefulBodyText(landing.title ?? "");
  const useful = usefulBodyText(snippetOf(landing));
  const phrase = matchedPhrase(haystack(landing));
  if (phrase) {
    return { parked: true, reason: `phrase="${phrase}"` };
  }
  if (!title) {
    return { parked: true, reason: "no-title" };
  }
  if (useful.length < THIN_BODY_MIN_CHARS) {
    return {
      parked: true,
      reason: `thin usefulChars=${useful.length}`,
    };
  }
  return { parked: false, reason: null };
}

export function isParked(landing: ParkingLanding): boolean {
  return inspectParking(landing).parked;
}
