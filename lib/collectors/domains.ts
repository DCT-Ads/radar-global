const MULTI_PART_TLDS = new Set([
  "co.uk",
  "org.uk",
  "ac.uk",
  "com.au",
  "net.au",
  "com.br",
  "com.mx",
  "co.jp",
  "com.ar",
  "co.nz",
  "com.co",
]);

const NOISE_SUFFIXES = [
  "cloudflare.net",
  "amazonaws.com",
  "googleusercontent.com",
  "akamaiedge.net",
  "edgekey.net",
  "microsoft.com",
  "office.com",
  "google.com",
  "facebook.com",
  "apple.com",
];

const CHECKOUT_LABELS = new Set(["checkout", "go", "pay", "order", "buy", "cart"]);

export function cleanHost(raw: string): string | null {
  let host = raw.trim().toLowerCase();
  if (host.startsWith("*.")) {
    host = host.slice(2);
  }
  if (host.startsWith(".")) {
    host = host.slice(1);
  }
  if (host.includes(":") || host.includes("/") || host.includes(" ")) {
    return null;
  }
  if (!host.includes(".") || host.includes("*")) {
    return null;
  }
  if (!/^[a-z0-9.-]+$/.test(host)) {
    return null;
  }
  if (NOISE_SUFFIXES.some((suffix) => host === suffix || host.endsWith(`.${suffix}`))) {
    return null;
  }
  return host;
}

export function apexDomain(host: string): string {
  const parts = host.split(".");
  if (parts.length < 2) {
    return host;
  }
  const lastTwo = parts.slice(-2).join(".");
  if (MULTI_PART_TLDS.has(lastTwo) && parts.length >= 3) {
    return parts.slice(-3).join(".");
  }
  return lastTwo;
}

export function isCheckoutHost(host: string): boolean {
  const apex = apexDomain(host);
  if (host === apex) {
    return false;
  }
  const labels = host.slice(0, -(apex.length + 1)).split(".");
  return labels.some((label) => CHECKOUT_LABELS.has(label));
}

export function domainSlug(domain: string): string {
  return domain.replace(/\./g, "-");
}

export function hostsFromNameValue(nameValue: string, commonName: string): string[] {
  const raw = `${nameValue}\n${commonName}`
    .split(/[\n,]+/)
    .map((item) => cleanHost(item))
    .filter((item): item is string => item !== null);
  return [...new Set(raw)];
}

export function ageInDays(date: Date, now = new Date()): number {
  return (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
}
