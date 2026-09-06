import {
  ageInDays,
  apexDomain,
  domainIncludesKeyword,
  hostsFromNameValue,
  isCheckoutHost,
} from "./domains";

export type CrtshEntry = {
  id: number;
  issuer_name: string;
  common_name: string;
  name_value: string;
  entry_timestamp: string;
  not_before: string;
  not_after: string;
};

export type DiscoveredDomain = {
  domain: string;
  keyword: string;
  firstSeenAt: Date;
  ageDays: number;
  hasCheckoutSubdomain: boolean;
  certIds: number[];
  evidenceUrl: string;
};

const CRTSH_TIMEOUT_MS = 20_000;
const CRTSH_RETRIES = 4;

function isCrtshEntry(value: unknown): value is CrtshEntry {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.id === "number" &&
    typeof entry.common_name === "string" &&
    typeof entry.name_value === "string" &&
    typeof entry.not_before === "string"
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchCrtshEntries(keyword: string): Promise<CrtshEntry[]> {
  const url = new URL("https://crt.sh/");
  url.searchParams.set("q", `%${keyword}%`);
  url.searchParams.set("exclude", "expired");
  url.searchParams.set("output", "json");

  let lastError: Error | null = null;
  for (let attempt = 0; attempt < CRTSH_RETRIES; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "RadarGlobal/1.0",
        },
        signal: AbortSignal.timeout(CRTSH_TIMEOUT_MS),
        cache: "no-store",
      });

      if (response.status === 429) {
        const wait = 10_000 * (attempt + 1);
        console.log(`crt.sh rate limit (429). Aguardando ${wait / 1000}s...`);
        lastError = new Error("crt.sh returned 429");
        await sleep(wait);
        continue;
      }

      if (response.status === 502 || response.status === 503) {
        lastError = new Error(`crt.sh returned ${response.status}`);
        await sleep(3_000 * (attempt + 1));
        continue;
      }

      if (!response.ok) {
        throw new Error(`crt.sh returned ${response.status}`);
      }

      const payload: unknown = await response.json();
      if (!Array.isArray(payload)) {
        throw new Error("crt.sh returned a non-JSON list");
      }

      return payload.filter(isCrtshEntry);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("crt.sh request failed");
      if (attempt === CRTSH_RETRIES - 1) {
        throw lastError;
      }
      await sleep(3_000 * (attempt + 1));
    }
  }

  throw lastError ?? new Error("crt.sh request failed");
}

export function discoverDomainsFromEntries(
  entries: CrtshEntry[],
  keyword: string,
  maxAgeDays: number,
  limit: number,
): DiscoveredDomain[] {
  const now = new Date();
  const grouped = new Map<string, DiscoveredDomain>();

  for (const entry of entries) {
    const issuedAt = new Date(entry.not_before);
    if (Number.isNaN(issuedAt.getTime())) {
      continue;
    }

    const hosts = hostsFromNameValue(entry.name_value, entry.common_name);
    for (const host of hosts) {
      const domain = apexDomain(host);
      if (!domainIncludesKeyword(domain, keyword)) {
        continue;
      }

      const current = grouped.get(domain);
      const checkout = isCheckoutHost(host);
      if (!current) {
        grouped.set(domain, {
          domain,
          keyword,
          firstSeenAt: issuedAt,
          ageDays: ageInDays(issuedAt, now),
          hasCheckoutSubdomain: checkout,
          certIds: [entry.id],
          evidenceUrl: `https://crt.sh/?q=${encodeURIComponent(domain)}`,
        });
        continue;
      }

      if (issuedAt < current.firstSeenAt) {
        current.firstSeenAt = issuedAt;
        current.ageDays = ageInDays(issuedAt, now);
      }
      current.hasCheckoutSubdomain ||= checkout;
      if (!current.certIds.includes(entry.id)) {
        current.certIds.push(entry.id);
      }
    }
  }

  return [...grouped.values()]
    .filter((item) => item.ageDays >= 0 && item.ageDays < maxAgeDays)
    .sort((a, b) => a.ageDays - b.ageDays)
    .slice(0, limit);
}
