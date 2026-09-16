import { apexDomain } from "@/lib/collectors/domains";

/** Lista usada por crt.sh / NRD / YouTube (match em domínio). Não incluir termos curtos tipo "ai". */
export const NICHES: Record<string, string[]> = {
  health: ["keto", "weightloss", "detox", "supplement", "fitness", "cbd"],
  finance: ["crypto", "forex", "trading", "invest"],
  tech: ["vpn", "aitool", "saas", "software"],
  beauty: ["skincare", "antiaging", "collagen"],
};

export const ALL_KEYWORDS = Object.values(NICHES).flat();

/** Match forte no título/vendor do marketplace. Independente de ALL_KEYWORDS. */
export const NICHE_TERMS = [
  "keto",
  "weightloss",
  "weight-loss",
  "cbd",
  "crypto",
  "skincare",
  "saas",
  "plr",
  "affiliate",
  "ecom",
  "ecommerce",
  "video",
  "traffic",
  "seo",
  "email",
  "funnel",
  "dropship",
  "coaching",
  "fitness",
  "supplement",
] as const;

/** Só usados se domínio e título falharem. */
const WEAK_TERMS = ["ai", "software"] as const;

const TERM_NICHE: Record<string, string> = {
  keto: "health",
  weightloss: "health",
  cbd: "health",
  fitness: "health",
  supplement: "health",
  detox: "health",
  crypto: "finance",
  affiliate: "finance",
  forex: "finance",
  trading: "finance",
  invest: "finance",
  software: "tech",
  saas: "tech",
  ai: "tech",
  video: "tech",
  seo: "tech",
  email: "tech",
  funnel: "tech",
  traffic: "tech",
  vpn: "tech",
  aitool: "tech",
  skincare: "beauty",
  antiaging: "beauty",
  collagen: "beauty",
  ecom: "ecommerce",
  ecommerce: "ecommerce",
  dropship: "ecommerce",
  plr: "content",
  coaching: "content",
};

const STOPWORDS = new Set([
  "the",
  "new",
  "pro",
  "live",
  "get",
  "ai",
  "app",
  "plus",
  "plr",
  "edition",
  "version",
  "confirmed",
  "launch",
  "simple",
  "easy",
  "ultimate",
  "master",
  "studio",
  "suite",
  "kit",
  "system",
  "a",
  "an",
  "and",
  "for",
  "with",
  "your",
  "my",
]);

const DIRECTORY_LABELS = new Set([
  "muncheye",
  "www",
]);

const GENERIC_HOSTS = new Set([
  "nams",
  "warriorplus",
  "jvzoo",
  "jvz",
  "clickbank",
  "gumroad",
  "thrivecart",
  "samcart",
  "paykickstart",
  "pages",
  "convertri",
]);

const TLD_LABELS = new Set([
  "com",
  "net",
  "org",
  "io",
  "dev",
  "co",
  "ws",
  "app",
  "info",
  "biz",
  "me",
  "xyz",
  "online",
  "site",
  "tech",
]);

export function nicheForKeyword(keyword: string): string | null {
  const needle = keyword.toLowerCase().replace(/-/g, "");
  for (const [niche, keywords] of Object.entries(NICHES)) {
    if (keywords.includes(needle) || keywords.includes(keyword.toLowerCase())) {
      return niche;
    }
  }
  return TERM_NICHE[needle] ?? null;
}

/** Casa termo como palavra isolada, não substring (evita 'cbd' em 'worship' / 'ai' em 'daily'). */
export function matchesKeywordWord(haystack: string, term: string): boolean {
  const pattern = new RegExp(`\\b${term.replace(/[-]/g, "[- ]?")}\\b`, "i");
  return pattern.test(haystack);
}

function matchesWord(haystack: string, term: string): boolean {
  return matchesKeywordWord(haystack, term);
}

function usableHost(name: string | null): name is string {
  return Boolean(
    name &&
      name.length >= 3 &&
      !GENERIC_HOSTS.has(name) &&
      !TLD_LABELS.has(name) &&
      !DIRECTORY_LABELS.has(name),
  );
}

/** Host registrável: muncheye:sales.foo.com → foo */
export function registrableName(domainOrValue: string | null | undefined): string | null {
  if (!domainOrValue) {
    return null;
  }
  const trimmed = domainOrValue.trim();
  let host = trimmed;
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed) && !/^https?:\/\//i.test(trimmed)) {
    host = trimmed.slice(trimmed.indexOf(":") + 1);
  }
  host = host.replace(/^https?:\/\//i, "").split("/")[0].split(":")[0].toLowerCase().trim();
  if (!host) {
    return null;
  }

  const apex = apexDomain(host);
  const label = apex.split(".").filter(Boolean)[0] ?? null;
  if (!label || DIRECTORY_LABELS.has(label) || TLD_LABELS.has(label)) {
    return null;
  }
  return label;
}

/** Primeira palavra significativa (pula stopwords, números, curtinhas). */
export function firstMeaningfulWord(text: string | null | undefined): string | null {
  if (!text) {
    return null;
  }
  const words = text
    .toLowerCase()
    .replace(/\[.*?\]/g, " ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  for (const word of words) {
    if (/^\d+$/.test(word)) {
      continue;
    }
    if (word.length < 3) {
      continue;
    }
    if (STOPWORDS.has(word)) {
      continue;
    }
    return word;
  }
  return null;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function asOptionalString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

/** slug do título limpo: "Canva Paradise [PLR]" -> "canva-paradise" */
export function titleSlug(text?: string | null): string | null {
  if (!text) {
    return null;
  }
  const slug = text
    .toLowerCase()
    .replace(/\[.*?\]/g, " ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .join("-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || null;
}

export type KeywordSource = "list" | "domain" | "title";

export type KeywordResult = {
  keyword: string | null;
  source: KeywordSource | null;
  kw_domain: string | null;
  kw_title: string | null;
  niche: string | null;
};

function withNiche(
  result: Omit<KeywordResult, "niche">,
): KeywordResult {
  return {
    ...result,
    niche: result.keyword ? nicheForKeyword(result.keyword) : null,
  };
}

/**
 * Cascata: lista → domínio → 1ª palavra. Sempre devolve kw_domain e kw_title.
 */
export function keywordFromText(
  productName?: string | null,
  vendor?: string | null,
  domainOrValue?: string | null,
): KeywordResult {
  const haystack = `${productName ?? ""} ${vendor ?? ""}`.toLowerCase();
  const kw_domain = registrableName(domainOrValue);
  const kw_title = titleSlug(productName);

  for (const term of NICHE_TERMS) {
    if (matchesWord(haystack, term)) {
      return withNiche({
        keyword: term.replace(/-/g, ""),
        source: "list",
        kw_domain,
        kw_title,
      });
    }
  }

  if (usableHost(kw_domain)) {
    return withNiche({
      keyword: kw_domain,
      source: "domain",
      kw_domain,
      kw_title,
    });
  }

  const word = firstMeaningfulWord(productName);
  if (word) {
    return withNiche({
      keyword: word,
      source: "title",
      kw_domain,
      kw_title,
    });
  }

  for (const term of WEAK_TERMS) {
    if (matchesWord(haystack, term)) {
      return withNiche({
        keyword: term,
        source: "list",
        kw_domain,
        kw_title,
      });
    }
  }

  if (usableHost(kw_domain)) {
    return withNiche({
      keyword: kw_domain,
      source: "domain",
      kw_domain,
      kw_title,
    });
  }

  return withNiche({
    keyword: null,
    source: null,
    kw_domain,
    kw_title,
  });
}

export function keywordMetaForRaw(inferred: KeywordResult) {
  return {
    kw_domain: inferred.kw_domain,
    kw_title: inferred.kw_title,
    keyword_source: inferred.source,
  };
}

export function mergeKeywordMeta(rawData: unknown, inferred: KeywordResult) {
  return {
    ...asRecord(rawData),
    ...keywordMetaForRaw(inferred),
  };
}

export function collectorKeywordMeta(input: {
  domain?: string | null;
  title?: string | null;
}) {
  const inferred = keywordFromText(input.title, null, input.domain);
  return {
    keyword_source: "list" as const,
    kw_domain: inferred.kw_domain,
    kw_title: inferred.kw_title ?? inferred.kw_domain,
  };
}

export function keywordFromMarketplaceRaw(
  rawData: unknown,
  domainOrValue?: string | null,
) {
  const raw = asRecord(rawData);
  return keywordFromText(
    asOptionalString(raw.product_name),
    asOptionalString(raw.vendor),
    domainOrValue,
  );
}
