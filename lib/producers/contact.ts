export type ProducerContact = {
  email: string | null;
  instagram: string | null;
  youtube: string | null;
  facebook: string | null;
  linkedin: string | null;
  x: string | null;
  telegram: string | null;
  companyName: string | null;
  contactScore: number;
};

export type ContactSource = {
  url?: string | null;
  title?: string | null;
  snippet?: string | null;
  raw?: unknown;
  email?: string | null;
  instagram?: string | null;
  youtube?: string | null;
  facebook?: string | null;
  linkedin?: string | null;
  x?: string | null;
  telegram?: string | null;
  companyName?: string | null;
  name?: string | null;
  domain?: string | null;
  website?: string | null;
};

export const CONTACT_SCORE_WEIGHTS = {
  email: 40,
  instagram: 20,
  youtube: 15,
  linkedin: 15,
  social: 10,
} as const;

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
const INSTAGRAM_RE =
  /(?:https?:\/\/)?(?:www\.)?instagram\.com\/([A-Za-z0-9._]{1,30})/i;
const LINKEDIN_RE =
  /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(in|company)\/([A-Za-z0-9_-]+)/i;
const YOUTUBE_AT_RE =
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/@([A-Za-z0-9._-]{1,60})/i;
const YOUTUBE_PATH_RE =
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/(channel|c|user)\/([A-Za-z0-9_-]+)/i;
const FACEBOOK_RE =
  /(?:https?:\/\/)?(?:www\.)?(?:facebook\.com|fb\.com)\/([A-Za-z0-9.]+)\/?/i;
const X_RE =
  /(?:https?:\/\/)?(?:www\.)?(?:x\.com|twitter\.com)\/([A-Za-z0-9_]{1,15})/i;
const TELEGRAM_RE =
  /(?:https?:\/\/)?(?:t\.me|telegram\.me|telegram\.dog)\/([A-Za-z0-9_]{5,32})/i;

const JUNK_EMAIL = [
  "whoisguard",
  "withheldforprivacy",
  "anonymized",
  "privacyprotect",
  "domainsbyproxy",
  "contactprivacy",
  "privacydotlink",
  "noreply",
  "no-reply",
  "donotreply",
  "abuse@",
  "hostmaster@",
  "postmaster@",
  "registrar",
];

const INSTAGRAM_RESERVED = new Set(["p", "reel", "reels", "stories", "explore", "accounts"]);
const FACEBOOK_RESERVED = new Set([
  "share",
  "watch",
  "photo",
  "photos",
  "reel",
  "reels",
  "posts",
  "stories",
  "login",
  "pages",
  "people",
  "groups",
  "marketplace",
  "events",
]);
const X_RESERVED = new Set([
  "home",
  "search",
  "intent",
  "share",
  "i",
  "settings",
  "compose",
  "explore",
  "notifications",
  "messages",
  "hashtag",
  "login",
]);
const TELEGRAM_RESERVED = new Set([
  "join",
  "addstickers",
  "share",
  "proxy",
  "socks",
  "iv",
  "login",
  "s",
]);

function collectStrings(value: unknown, into: string[]) {
  if (typeof value === "string") {
    into.push(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      collectStrings(item, into);
    }
    return;
  }
  if (value && typeof value === "object") {
    for (const item of Object.values(value)) {
      collectStrings(item, into);
    }
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function stringField(raw: Record<string, unknown> | null, key: string) {
  const value = raw?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function isPublicProducerEmail(email: string) {
  const lower = email.trim().toLowerCase();
  if (!lower.includes("@") || lower.length > 254) {
    return false;
  }
  return !JUNK_EMAIL.some((junk) => lower.includes(junk));
}

export function normalizeInstagram(value: string | null | undefined) {
  if (!value) {
    return null;
  }
  const fromUrl = value.match(INSTAGRAM_RE)?.[1];
  const handle = (fromUrl ?? value.replace(/^@/, "")).trim();
  if (!/^[A-Za-z0-9._]{1,30}$/.test(handle)) {
    return null;
  }
  if (INSTAGRAM_RESERVED.has(handle.toLowerCase())) {
    return null;
  }
  return handle;
}

export function normalizeLinkedin(value: string | null | undefined) {
  if (!value) {
    return null;
  }
  const match = value.match(LINKEDIN_RE);
  if (match) {
    return `${match[1]}/${match[2]}`;
  }
  const trimmed = value.replace(/^\/+/, "").replace(/^linkedin\.com\//i, "");
  if (/^(in|company)\/[A-Za-z0-9_-]+$/.test(trimmed)) {
    return trimmed;
  }
  return null;
}

export function normalizeYoutube(value: string | null | undefined) {
  if (!value) {
    return null;
  }
  const at = value.match(YOUTUBE_AT_RE)?.[1];
  if (at) {
    return `@${at}`;
  }
  const path = value.match(YOUTUBE_PATH_RE);
  if (path) {
    return `${path[1]}/${path[2]}`;
  }
  const trimmed = value.replace(/^\/+/, "").replace(/^youtube\.com\//i, "");
  if (/^@[A-Za-z0-9._-]{1,60}$/.test(trimmed)) {
    return trimmed;
  }
  if (/^(channel|c|user)\/[A-Za-z0-9_-]+$/.test(trimmed)) {
    return trimmed;
  }
  return null;
}

export function normalizeFacebook(value: string | null | undefined) {
  if (!value) {
    return null;
  }
  const fromUrl = value.match(FACEBOOK_RE)?.[1];
  const handle = (fromUrl ?? value.replace(/^@/, "")).trim();
  if (!/^[A-Za-z0-9.]{1,80}$/.test(handle)) {
    return null;
  }
  if (FACEBOOK_RESERVED.has(handle.toLowerCase())) {
    return null;
  }
  return handle;
}

export function normalizeX(value: string | null | undefined) {
  if (!value) {
    return null;
  }
  const fromUrl = value.match(X_RE)?.[1];
  const handle = (fromUrl ?? value.replace(/^@/, "")).trim();
  if (!/^[A-Za-z0-9_]{1,15}$/.test(handle)) {
    return null;
  }
  if (X_RESERVED.has(handle.toLowerCase())) {
    return null;
  }
  return handle;
}

export function normalizeTelegram(value: string | null | undefined) {
  if (!value) {
    return null;
  }
  const fromUrl = value.match(TELEGRAM_RE)?.[1];
  const handle = (fromUrl ?? value.replace(/^@/, "")).trim();
  if (!/^[A-Za-z0-9_]{5,32}$/.test(handle)) {
    return null;
  }
  if (TELEGRAM_RESERVED.has(handle.toLowerCase())) {
    return null;
  }
  return handle;
}

function firstMatch<T>(texts: string[], normalize: (value: string) => T | null) {
  for (const text of texts) {
    const value = normalize(text);
    if (value) {
      return value;
    }
  }
  return null;
}

function firstEmail(texts: string[]) {
  for (const text of texts) {
    const matches = text.match(EMAIL_RE) ?? [];
    for (const email of matches) {
      const lower = email.toLowerCase();
      if (isPublicProducerEmail(lower)) {
        return lower;
      }
    }
  }
  return null;
}

function companyNameFromSources(sources: ContactSource[]) {
  const stored = sources
    .map((source) => source.companyName?.trim())
    .find((value) => value);
  if (stored) {
    return stored;
  }

  for (const source of sources) {
    const raw = asRecord(source.raw);
    const fromRaw =
      stringField(raw, "companyName") ??
      stringField(raw, "company") ??
      stringField(raw, "channelTitle");
    if (fromRaw) {
      return fromRaw;
    }
  }

  for (const source of sources) {
    const name = source.name?.trim();
    const domain = source.domain?.trim();
    if (name && domain && name.toLowerCase() !== domain.toLowerCase()) {
      return name;
    }
  }

  return null;
}

export function contactScoreOf(
  contact: Pick<
    ProducerContact,
    | "email"
    | "instagram"
    | "youtube"
    | "facebook"
    | "linkedin"
    | "x"
    | "telegram"
    | "companyName"
  >,
) {
  return (
    (contact.email ? CONTACT_SCORE_WEIGHTS.email : 0) +
    (contact.instagram ? CONTACT_SCORE_WEIGHTS.instagram : 0) +
    (contact.youtube ? CONTACT_SCORE_WEIGHTS.youtube : 0) +
    (contact.linkedin ? CONTACT_SCORE_WEIGHTS.linkedin : 0) +
    (contact.facebook || contact.x || contact.telegram
      ? CONTACT_SCORE_WEIGHTS.social
      : 0)
  );
}

export function extractProducerContact(sources: ContactSource[]): ProducerContact {
  const storedEmail = sources.map((source) => source.email).find(Boolean) ?? null;
  const storedInstagram =
    sources.map((source) => normalizeInstagram(source.instagram)).find(Boolean) ?? null;
  const storedYoutube =
    sources.map((source) => normalizeYoutube(source.youtube)).find(Boolean) ?? null;
  const storedFacebook =
    sources.map((source) => normalizeFacebook(source.facebook)).find(Boolean) ?? null;
  const storedLinkedin =
    sources.map((source) => normalizeLinkedin(source.linkedin)).find(Boolean) ?? null;
  const storedX = sources.map((source) => normalizeX(source.x)).find(Boolean) ?? null;
  const storedTelegram =
    sources.map((source) => normalizeTelegram(source.telegram)).find(Boolean) ?? null;

  const texts: string[] = [];
  for (const source of sources) {
    texts.push(source.url ?? "", source.website ?? "", source.title ?? "", source.snippet ?? "");
    collectStrings(source.raw, texts);
  }

  const email =
    storedEmail && isPublicProducerEmail(storedEmail)
      ? storedEmail.toLowerCase()
      : firstEmail(texts);
  const instagram = storedInstagram ?? firstMatch(texts, normalizeInstagram);
  const youtube = storedYoutube ?? firstMatch(texts, normalizeYoutube);
  const facebook = storedFacebook ?? firstMatch(texts, normalizeFacebook);
  const linkedin = storedLinkedin ?? firstMatch(texts, normalizeLinkedin);
  const x = storedX ?? firstMatch(texts, normalizeX);
  const telegram = storedTelegram ?? firstMatch(texts, normalizeTelegram);
  const companyName = companyNameFromSources(sources);

  const contact = {
    email,
    instagram,
    youtube,
    facebook,
    linkedin,
    x,
    telegram,
    companyName,
  };
  return { ...contact, contactScore: contactScoreOf(contact) };
}

export function producerContactWriteData(contact: ProducerContact, now = new Date()) {
  return {
    email: contact.email,
    instagram: contact.instagram,
    youtube: contact.youtube,
    facebook: contact.facebook,
    linkedin: contact.linkedin,
    x: contact.x,
    companyName: contact.companyName,
    contactScore: contact.contactScore,
    enrichedAt: now,
  };
}

export function instagramHref(handle: string) {
  return `https://instagram.com/${handle}`;
}

export function linkedinHref(path: string) {
  return `https://linkedin.com/${path}`;
}

export function youtubeHref(value: string) {
  if (value.startsWith("@") || value.includes("/")) {
    return `https://youtube.com/${value}`;
  }
  return `https://youtube.com/@${value}`;
}

export function facebookHref(handle: string) {
  return `https://facebook.com/${handle}`;
}

export function xHref(handle: string) {
  return `https://x.com/${handle}`;
}

export function telegramHref(handle: string) {
  return `https://t.me/${handle}`;
}

export function hasProducerContact(contact: ProducerContact) {
  return Boolean(
    contact.email ||
      contact.instagram ||
      contact.youtube ||
      contact.facebook ||
      contact.linkedin ||
      contact.x ||
      contact.telegram ||
      contact.companyName,
  );
}
