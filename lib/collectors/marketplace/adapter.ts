import type { MarketplaceLaunch } from "./types";

/**
 * Converte o DTO unificado para o formato de Signal atual.
 * Não grava no banco — só adapta o payload.
 */
export function jvzooPidFromUrl(url: string): string | null {
  try {
    const pid = new URL(url).searchParams.get("pid");
    return pid && /^\d+$/.test(pid) ? pid : null;
  } catch {
    return null;
  }
}

export function jvzooCanonicalUrl(pid: string) {
  return `https://www.jvzoo.com/productlibrary/marketframe?pid=${pid}`;
}

/** Chave estável: /o/view/{id} — não o hostname warriorplus.com. */
export function warriorplusOfferKey(offerLink: string): string | null {
  try {
    const parsed = new URL(offerLink, "https://warriorplus.com");
    const match = parsed.pathname.match(/^(\/o\/view\/[A-Za-z0-9_-]+)/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

export function marketplaceLaunchToSignalPayload(item: MarketplaceLaunch) {
  const warriorKey =
    item.source === "warriorplus" ? warriorplusOfferKey(item.url) : null;
  const jvzooPid = item.source === "jvzoo" ? jvzooPidFromUrl(item.url) : null;
  const value = warriorKey
    ? warriorKey
    : jvzooPid
      ? `jvzoo:${jvzooPid}`
      : [
          item.source,
          item.product_name.toLowerCase().trim(),
          item.launch_date ?? "undated",
        ].join(":");
  const url = jvzooPid ? jvzooCanonicalUrl(jvzooPid) : item.url;
  const domain = warriorKey
    ? `warriorplus.com${warriorKey}`
    : hostFromUrl(url);

  return {
    type: "LANDING_PAGE" as const,
    source: item.source,
    value,
    url,
    niche: item.niche,
    domain,
    rawData: {
      product_name: item.product_name,
      vendor: item.vendor,
      launch_date: item.launch_date,
      status: item.status,
      raw_scraped_at: item.raw_scraped_at,
      ...(jvzooPid ? { pid: jvzooPid } : {}),
    },
  };
}

function hostFromUrl(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}
