import { NICHES } from "@/lib/niches";
import { publicSuffix } from "@/lib/collectors/domains";

/** ccTLD → mercado. gTLD (.com/.net/…) não inventa país. */
const CC_TLD: Record<string, { country: string; lang: string }> = {
  br: { country: "BR", lang: "pt" },
  pt: { country: "PT", lang: "pt" },
  es: { country: "ES", lang: "es" },
  mx: { country: "MX", lang: "es" },
  ar: { country: "AR", lang: "es" },
  cl: { country: "CL", lang: "es" },
  co: { country: "CO", lang: "es" },
  pe: { country: "PE", lang: "es" },
  uy: { country: "UY", lang: "es" },
  ve: { country: "VE", lang: "es" },
  ec: { country: "EC", lang: "es" },
  py: { country: "PY", lang: "es" },
  bo: { country: "BO", lang: "es" },
  cr: { country: "CR", lang: "es" },
  de: { country: "DE", lang: "de" },
  at: { country: "AT", lang: "de" },
  ch: { country: "CH", lang: "de" },
  fr: { country: "FR", lang: "fr" },
  be: { country: "BE", lang: "fr" },
  it: { country: "IT", lang: "it" },
  nl: { country: "NL", lang: "nl" },
  uk: { country: "GB", lang: "en" },
  us: { country: "US", lang: "en" },
  au: { country: "AU", lang: "en" },
  ca: { country: "CA", lang: "en" },
  nz: { country: "NZ", lang: "en" },
  ie: { country: "IE", lang: "en" },
  sg: { country: "SG", lang: "en" },
  in: { country: "IN", lang: "en" },
  za: { country: "ZA", lang: "en" },
  jp: { country: "JP", lang: "ja" },
  kr: { country: "KR", lang: "ko" },
  cn: { country: "CN", lang: "zh" },
};

const GEO_TOKENS: Record<string, { country: string; lang: string }> = {
  brasil: { country: "BR", lang: "pt" },
  brazil: { country: "BR", lang: "pt" },
  portuguese: { country: "PT", lang: "pt" },
  portugal: { country: "PT", lang: "pt" },
  mexico: { country: "MX", lang: "es" },
  mexicooficial: { country: "MX", lang: "es" },
  argentina: { country: "AR", lang: "es" },
  chile: { country: "CL", lang: "es" },
  colombia: { country: "CO", lang: "es" },
  peru: { country: "PE", lang: "es" },
  espanha: { country: "ES", lang: "es" },
  espana: { country: "ES", lang: "es" },
  spain: { country: "ES", lang: "es" },
  latam: { country: "MX", lang: "es" },
  france: { country: "FR", lang: "fr" },
  franca: { country: "FR", lang: "fr" },
  germany: { country: "DE", lang: "de" },
  alemanha: { country: "DE", lang: "de" },
  italia: { country: "IT", lang: "it" },
  italy: { country: "IT", lang: "it" },
  japan: { country: "JP", lang: "ja" },
  japao: { country: "JP", lang: "ja" },
  india: { country: "IN", lang: "en" },
  australia: { country: "AU", lang: "en" },
  canada: { country: "CA", lang: "en" },
  uk: { country: "GB", lang: "en" },
  britain: { country: "GB", lang: "en" },
  england: { country: "GB", lang: "en" },
  usa: { country: "US", lang: "en" },
  unitedstates: { country: "US", lang: "en" },
};

const LANG_TOKENS: Record<string, string> = {
  saude: "pt",
  emagrecer: "pt",
  emagrecimento: "pt",
  dinheiro: "pt",
  investimento: "pt",
  investimentos: "pt",
  oficial: "pt",
  salud: "es",
  adelgazar: "es",
  dinero: "es",
  inversion: "es",
  inversiones: "es",
  sante: "fr",
  argent: "fr",
};

const ENGLISH_KEYWORDS = new Set(Object.values(NICHES).flat());

const REGION_TO_COUNTRY: Record<string, string> = {
  GB: "GB",
  UK: "GB",
};

export type GeoHints = {
  countryHint: string | null;
  langHint: string | null;
};

function domainTokens(domain: string): string[] {
  return domain
    .toLowerCase()
    .split(".")
    .flatMap((label) => label.split(/[-_]+/))
    .filter((token) => token.length >= 2);
}

function ccFromSuffix(suffix: string): { country: string; lang: string } | null {
  const cc = suffix.includes(".") ? suffix.split(".").pop() : suffix;
  if (!cc) {
    return null;
  }
  return CC_TLD[cc] ?? null;
}

/** BCP-47 / og:locale: pt-BR, en_US, es-MX. `en` sozinho não vira EUA. */
export function inferGeoFromLocale(locale: string): GeoHints {
  const normalized = locale.trim().replace("_", "-");
  const [languageRaw, regionRaw] = normalized.split("-");
  const langHint = languageRaw?.toLowerCase() || null;
  const region = regionRaw?.toUpperCase();
  const countryHint = region
    ? (REGION_TO_COUNTRY[region] ?? (region.length === 2 ? region : null))
    : null;
  return { countryHint, langHint };
}

export function inferGeoFromDomain(
  domain: string,
  keyword?: string | null,
): GeoHints {
  const suffix = publicSuffix(domain);
  const fromTld = ccFromSuffix(suffix);
  const tokens = domainTokens(domain);

  let countryHint = fromTld?.country ?? null;
  let langHint = fromTld?.lang ?? null;

  if (!countryHint) {
    const geo = tokens.map((token) => GEO_TOKENS[token]).find(Boolean);
    if (geo) {
      countryHint = geo.country;
      langHint = langHint ?? geo.lang;
    }
  }

  if (!langHint) {
    const tokenLang = tokens.map((token) => LANG_TOKENS[token]).find(Boolean);
    if (tokenLang) {
      langHint = tokenLang;
    }
  }

  if (!langHint && keyword && ENGLISH_KEYWORDS.has(keyword.toLowerCase())) {
    langHint = "en";
  }

  return { countryHint, langHint };
}

export function inferGeo(input: {
  domain: string;
  keyword?: string | null;
  pageLocale?: string | null;
}): GeoHints {
  const fromDomain = inferGeoFromDomain(input.domain, input.keyword);
  const fromPage = input.pageLocale ? inferGeoFromLocale(input.pageLocale) : null;

  return {
    countryHint: fromDomain.countryHint ?? fromPage?.countryHint ?? null,
    langHint: fromDomain.langHint ?? fromPage?.langHint ?? null,
  };
}
