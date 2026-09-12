const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

const TIMEOUT_MS = 15_000;
const RETRIES = 3;
const RETRY_GAP_MS = 1_000;
export const REQUEST_GAP_MS = 1_500;

const robotsCache = new Map<string, Promise<RobotsRules>>();

type RobotsRules = {
  allow: string[];
  disallow: string[];
};

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRobots(text: string): RobotsRules {
  const allow: string[] = [];
  const disallow: string[] = [];
  let applies = false;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) {
      continue;
    }
    const [field, ...rest] = line.split(":");
    const value = rest.join(":").trim();
    const key = field?.trim().toLowerCase();
    if (key === "user-agent") {
      applies = value === "*" || value === "";
      continue;
    }
    if (!applies) {
      continue;
    }
    if (key === "allow" && value) {
      allow.push(value);
    }
    if (key === "disallow") {
      disallow.push(value);
    }
  }

  return { allow, disallow };
}

function ruleLength(rule: string) {
  return rule.endsWith("*") ? rule.length - 1 : rule.length;
}

function ruleMatches(pathname: string, rule: string) {
  if (!rule) {
    return false;
  }
  const prefix = rule.endsWith("*") ? rule.slice(0, -1) : rule;
  if (prefix === "/") {
    return true;
  }
  return pathname === prefix || pathname.startsWith(prefix);
}

export function pathAllowedByRobots(pathname: string, rules: RobotsRules) {
  let bestAllow = -1;
  let bestDisallow = -1;
  for (const rule of rules.allow) {
    if (ruleMatches(pathname, rule)) {
      bestAllow = Math.max(bestAllow, ruleLength(rule));
    }
  }
  for (const rule of rules.disallow) {
    if (ruleMatches(pathname, rule)) {
      bestDisallow = Math.max(bestDisallow, ruleLength(rule));
    }
  }
  if (bestDisallow < 0 && bestAllow < 0) {
    return true;
  }
  return bestAllow >= bestDisallow;
}

async function loadRobots(origin: string): Promise<RobotsRules> {
  const cached = robotsCache.get(origin);
  if (cached) {
    return cached;
  }
  const pending = (async () => {
    try {
      const res = await fetch(`${origin}/robots.txt`, {
        headers: { "User-Agent": USER_AGENT, Accept: "text/plain" },
        redirect: "follow",
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!res.ok) {
        return { allow: ["/"], disallow: [] };
      }
      return parseRobots(await res.text());
    } catch {
      return { allow: ["/"], disallow: [] };
    }
  })();
  robotsCache.set(origin, pending);
  return pending;
}

export async function isUrlAllowedByRobots(url: string): Promise<boolean> {
  const parsed = new URL(url);
  const rules = await loadRobots(parsed.origin);
  return pathAllowedByRobots(parsed.pathname, rules);
}

export type HtmlFetch = {
  ok: boolean;
  status: number;
  url: string;
  html: string;
};

export class RobotsBlockedError extends Error {
  readonly url: string;
  constructor(url: string) {
    super(`robots.txt blocks ${url}`);
    this.name = "RobotsBlockedError";
    this.url = url;
  }
}

async function fetchFollowingRedirects(url: string): Promise<HtmlFetch> {
  let current = url;
  for (let hop = 0; hop < 8; hop += 1) {
    if (!(await isUrlAllowedByRobots(current))) {
      throw new RobotsBlockedError(current);
    }
    const res = await fetch(current, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) {
        throw new Error(`redirect sem Location em ${current}`);
      }
      current = new URL(location, current).toString();
      continue;
    }
    return { ok: res.ok, status: res.status, url: current, html: await res.text() };
  }
  throw new Error(`muitos redirects a partir de ${url}`);
}

export async function fetchHtml(url: string): Promise<HtmlFetch> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= RETRIES; attempt += 1) {
    try {
      return await fetchFollowingRedirects(url);
    } catch (error) {
      if (error instanceof RobotsBlockedError) {
        throw error;
      }
      lastError = error;
      if (attempt < RETRIES) {
        await sleep(RETRY_GAP_MS * attempt);
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error("fetch failed");
}
