export const COPY_LANGUAGES = ["pt", "en", "es"] as const;
export type CopyLanguage = (typeof COPY_LANGUAGES)[number];

export const PRESELL_TEMPLATES = ["blog", "vsl", "quiz", "comparison"] as const;
export type PresellTemplate = (typeof PRESELL_TEMPLATES)[number];

export type CopyPack = {
  language: CopyLanguage;
  framework: "AIDA" | "PAS";
  headlines: [string, string, string];
  body: string;
  ctas: [string, string, string];
  shortCopy: string;
  longCopy: string;
};

export function languageForMarket(
  market: string | null | undefined,
  fallback: CopyLanguage,
): CopyLanguage {
  const code = (market ?? "").trim().toUpperCase();
  if (code === "BR" || code === "PT" || code === "BRASIL") return "pt";
  if (["ES", "MX", "AR", "CO", "CL", "PE"].includes(code)) return "es";
  if (["US", "USA", "EUA", "UK", "GB", "AU", "CA"].includes(code)) return "en";
  return fallback;
}

export function languageLabel(language: CopyLanguage) {
  if (language === "pt") return "português brasileiro";
  if (language === "es") return "español";
  return "English";
}

function clip(value: string, max: number) {
  const text = value.replace(/\s+/g, " ").trim();
  return text.length > max ? text.slice(0, max).trim() : text;
}

function three(value: unknown, max: number): [string, string, string] | null {
  if (!Array.isArray(value)) return null;
  const lines = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => clip(item, max))
    .filter(Boolean);
  if (lines.length < 3) return null;
  return [lines[0], lines[1], lines[2]];
}

export function parseCopyPack(raw: string, language: CopyLanguage): CopyPack | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;

  let data: unknown;
  try {
    data = JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
  if (!data || typeof data !== "object") return null;

  const record = data as Record<string, unknown>;
  const headlines = three(record.headlines, 180);
  const ctas = three(record.ctas, 120);
  const body = typeof record.body === "string" ? clip(record.body, 2500) : "";
  const shortCopy = typeof record.shortCopy === "string" ? clip(record.shortCopy, 700) : "";
  const longCopy = typeof record.longCopy === "string" ? clip(record.longCopy, 6000) : "";
  if (!headlines || !ctas || !body || !shortCopy || !longCopy) return null;

  const framework = record.framework === "PAS" ? "PAS" : "AIDA";
  return { language, framework, headlines, body, ctas, shortCopy, longCopy };
}

export function presellSlug(product: string) {
  const base = product
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 42);
  const suffix = Math.random().toString(36).slice(2, 8);
  return `presell-${base || "oferta"}-${suffix}`;
}

export function isPresellTemplate(value: string | null | undefined): value is PresellTemplate {
  return PRESELL_TEMPLATES.includes(value as PresellTemplate);
}

export function httpsUrl(value: string | null | undefined) {
  const text = value?.trim() ?? "";
  if (!text) return "";
  try {
    const url = new URL(text);
    if (url.protocol !== "https:") return "";
    return url.toString().slice(0, 500);
  } catch {
    return "";
  }
}

export function asStringList(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}
