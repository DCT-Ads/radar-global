import * as cheerio from "cheerio";
import { prisma } from "@/lib/prisma";
import { isPublicProducerEmail } from "@/lib/producers/contact";

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
const IG_RE = /instagram\.com\/([A-Za-z0-9_.]+)/i;
const YT_RE =
  /youtube\.com\/(@[A-Za-z0-9_.-]+|channel\/[A-Za-z0-9_-]+|c\/[A-Za-z0-9_.-]+)/i;
const FB_RE = /facebook\.com\/([A-Za-z0-9_.-]+)/i;
const LI_RE = /linkedin\.com\/(company|in)\/([A-Za-z0-9_.-]+)/i;
const X_RE = /(?:twitter|x)\.com\/([A-Za-z0-9_]{1,15})/i;

const SOCIAL_IGNORE = new Set([
  "sharer",
  "share",
  "intent",
  "home",
  "explore",
  "watch",
  "results",
  "hashtag",
]);

const SKIP_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "youtu.be",
  "digistore24.com",
  "www.digistore24.com",
  "instagram.com",
  "facebook.com",
  "fb.com",
  "twitter.com",
  "x.com",
  "linkedin.com",
]);

export type ProducerEnrichment = {
  email: string | null;
  instagram: string | null;
  youtube: string | null;
  facebook: string | null;
  linkedin: string | null;
  x: string | null;
  contactScore: number;
};

export const ENRICH_STALE_MS = 7 * 24 * 60 * 60 * 1000;

export type EnrichFetchFn = (url: string) => Promise<{ ok: boolean; text: () => Promise<string> }>;

export function isProducerEnrichmentDue(enrichedAt: Date | null | undefined, now = new Date()) {
  if (!enrichedAt) {
    return true;
  }
  return now.getTime() - enrichedAt.getTime() >= ENRICH_STALE_MS;
}

function emptyEnrichment(): ProducerEnrichment {
  return {
    email: null,
    instagram: null,
    youtube: null,
    facebook: null,
    linkedin: null,
    x: null,
    contactScore: 0,
  };
}

function firstMatch(re: RegExp, html: string, ignore?: Set<string>): string | null {
  const match = html.match(re);
  if (!match) {
    return null;
  }
  const handle = match[match.length - 1];
  if (!handle || ignore?.has(handle.toLowerCase())) {
    return null;
  }
  return handle;
}

function pickEmail(html: string, domain: string): string | null {
  const found = [
    ...new Set((html.match(EMAIL_RE) ?? []).map((email) => email.toLowerCase())),
  ].filter((email) => !/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(email) && isPublicProducerEmail(email));
  if (found.length === 0) {
    return null;
  }
  const root = domain.replace(/^www\./, "");
  return found.find((email) => email.endsWith(`@${root}`)) ?? found[0] ?? null;
}

export function enrichHost(domain: string): string | null {
  const host = domain
    .replace(/^https?:\/\//, "")
    .split("/")[0]
    ?.replace(/^www\./, "")
    .trim()
    .toLowerCase();
  if (!host || !host.includes(".") || SKIP_HOSTS.has(host) || SKIP_HOSTS.has(`www.${host}`)) {
    return null;
  }
  return host;
}

export function parseProducerHtml(html: string, domain: string): ProducerEnrichment {
  const $ = cheerio.load(html);
  const hrefs = $("a[href]")
    .map((_, el) => $(el).attr("href") ?? "")
    .get()
    .join(" ");
  const haystack = `${html} ${hrefs}`;

  const email = pickEmail(haystack, domain);
  const instagram = firstMatch(IG_RE, haystack, SOCIAL_IGNORE);
  const youtube = firstMatch(YT_RE, haystack);
  const facebook = firstMatch(FB_RE, haystack, SOCIAL_IGNORE);
  const linkedinMatch = haystack.match(LI_RE);
  const linkedin = linkedinMatch ? `${linkedinMatch[1]}/${linkedinMatch[2]}` : null;
  const x = firstMatch(X_RE, haystack, SOCIAL_IGNORE);

  const contactScore =
    (email ? 40 : 0) +
    (instagram ? 20 : 0) +
    (youtube ? 15 : 0) +
    (linkedin ? 15 : 0) +
    (facebook || x ? 10 : 0);

  return { email, instagram, youtube, facebook, linkedin, x, contactScore };
}

async function defaultEnrichFetch(url: string) {
  return fetch(url, {
    redirect: "follow",
    headers: { "User-Agent": "Mozilla/5.0 (RadarGlobalBot; +affiliate-intel)" },
    signal: AbortSignal.timeout(10_000),
  });
}

export async function enrichProducer(
  domain: string,
  fetchFn: EnrichFetchFn = defaultEnrichFetch,
): Promise<ProducerEnrichment> {
  const host = enrichHost(domain);
  const empty = emptyEnrichment();
  if (!host) {
    return empty;
  }

  const url = `https://${host}`;
  try {
    const res = await fetchFn(url);
    if (!res.ok) {
      return empty;
    }
    const html = await res.text();
    return parseProducerHtml(html, host);
  } catch {
    return empty;
  }
}

export async function enrichProducerById(producerId: string) {
  const producer = await prisma.producer.findUnique({ where: { id: producerId } });
  if (!producer) {
    return null;
  }

  if (!isProducerEnrichmentDue(producer.enrichedAt)) {
    return producer;
  }

  const domain = producer.website ?? producer.domain;
  const info = await enrichProducer(domain);

  return prisma.producer.update({
    where: { id: producerId },
    data: { ...info, enrichedAt: new Date() },
  });
}
