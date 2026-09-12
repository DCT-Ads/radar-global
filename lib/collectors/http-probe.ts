import { usefulBodyText } from "@/lib/signals/anti-parking";

export type ProbePathResult = {
  path: string;
  url: string;
  live: boolean;
  status: number | null;
  title: string | null;
  body: string | null;
  bodySnippet: string | null;
  contentLanguage: string | null;
  htmlLang: string | null;
  ogLocale: string | null;
  probedAt: string;
};

export type HttpProbeResult = {
  landing: ProbePathResult;
  checkout: ProbePathResult;
  go: ProbePathResult;
  pay: ProbePathResult;
};

const PROBE_TIMEOUT_MS = 8_000;
const BODY_SNIPPET_BYTES = 3_000;

function stripNullBytes(value: string | null): string | null {
  return value ? value.replaceAll("\u0000", "") : value;
}
const TITLE_RE = /<title[^>]*>([^<]+)<\/title>/i;
const HTML_LANG_RE = /<html[^>]*\slang=["']([^"']+)["']/i;
const OG_LOCALE_RE =
  /<meta[^>]+(?:property=["']og:locale["'][^>]*content=["']([^"']+)["']|content=["']([^"']+)["'][^>]*property=["']og:locale["'])/i;

/** Header de servidor costuma ser "en" genérico. Página (html/og) é mais específica. */
const LOCALE_SOURCE_RANK = {
  htmlLang: 2,
  ogLocale: 1,
  contentLanguage: 0,
} as const;

type LocaleSource = keyof typeof LOCALE_SOURCE_RANK;

function firstLocaleTag(raw: string): string | null {
  const tag = raw.split(",")[0]?.trim().replace("_", "-");
  return tag || null;
}

function localeSpecificity(tag: string): number {
  return tag.includes("-") ? 1 : 0;
}

export function pageLocaleFromProbe(probe: {
  contentLanguage?: string | null;
  htmlLang?: string | null;
  ogLocale?: string | null;
}): string | null {
  const candidates: Array<{ tag: string; source: LocaleSource }> = [];
  const push = (raw: string | null | undefined, source: LocaleSource) => {
    if (!raw) {
      return;
    }
    const tag = firstLocaleTag(raw);
    if (tag) {
      candidates.push({ tag, source });
    }
  };

  push(probe.htmlLang, "htmlLang");
  push(probe.ogLocale, "ogLocale");
  push(probe.contentLanguage, "contentLanguage");

  if (candidates.length === 0) {
    return null;
  }

  candidates.sort((a, b) => {
    const spec = localeSpecificity(b.tag) - localeSpecificity(a.tag);
    if (spec !== 0) {
      return spec;
    }
    return LOCALE_SOURCE_RANK[b.source] - LOCALE_SOURCE_RANK[a.source];
  });

  return candidates[0]?.tag ?? null;
}

export function pageLocaleFromRawData(rawData: unknown): string | null {
  if (!rawData || typeof rawData !== "object" || Array.isArray(rawData)) {
    return null;
  }
  const probe = (rawData as { httpProbe?: { landing?: unknown } }).httpProbe?.landing;
  if (!probe || typeof probe !== "object" || Array.isArray(probe)) {
    return null;
  }
  const landing = probe as {
    contentLanguage?: unknown;
    htmlLang?: unknown;
    ogLocale?: unknown;
  };
  const asText = (value: unknown) => (typeof value === "string" ? value : null);
  return pageLocaleFromProbe({
    contentLanguage: asText(landing.contentLanguage),
    htmlLang: asText(landing.htmlLang),
    ogLocale: asText(landing.ogLocale),
  });
}

async function probeUrl(url: string): Promise<Omit<ProbePathResult, "path">> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "RadarGlobalBot/1.0 (availability probe)",
        Accept: "text/html,application/xhtml+xml",
      },
      cache: "no-store",
    });

    const live = response.status >= 200 && response.status < 400;
    let title: string | null = null;
    let body: string | null = null;
    let bodySnippet: string | null = null;
    let htmlLang: string | null = null;
    let ogLocale: string | null = null;
    if (live) {
      const html = (await response.text()).slice(0, 8_000);
      bodySnippet = stripNullBytes(html.slice(0, BODY_SNIPPET_BYTES) || null);
      body = stripNullBytes(usefulBodyText(html).slice(0, 2_000) || null);
      const match = TITLE_RE.exec(html);
      title = stripNullBytes(match?.[1]?.trim().replace(/\s+/g, " ").slice(0, 160) ?? null);
      htmlLang = stripNullBytes(HTML_LANG_RE.exec(html)?.[1]?.trim() ?? null);
      const og = OG_LOCALE_RE.exec(html);
      ogLocale = stripNullBytes(og?.[1]?.trim() || og?.[2]?.trim() || null);
    }

    return {
      url: response.url || url,
      live,
      status: response.status,
      title,
      body,
      bodySnippet,
      contentLanguage: response.headers.get("content-language"),
      htmlLang,
      ogLocale,
      probedAt: new Date().toISOString(),
    };
  } catch {
    return {
      url,
      live: false,
      status: null,
      title: null,
      body: null,
      bodySnippet: null,
      contentLanguage: null,
      htmlLang: null,
      ogLocale: null,
      probedAt: new Date().toISOString(),
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function probeLanding(domain: string): Promise<ProbePathResult> {
  const url = `https://${domain}/`;
  return { path: "/", ...(await probeUrl(url)) };
}

export async function probeLaunch(domain: string): Promise<HttpProbeResult> {
  const origin = `https://${domain}`;
  const [landing, checkout, go, pay] = await Promise.all([
    probeUrl(`${origin}/`),
    probeUrl(`${origin}/checkout`),
    probeUrl(`${origin}/go`),
    probeUrl(`${origin}/pay`),
  ]);

  return {
    landing: { path: "/", ...landing },
    checkout: { path: "/checkout", ...checkout },
    go: { path: "/go", ...go },
    pay: { path: "/pay", ...pay },
  };
}
