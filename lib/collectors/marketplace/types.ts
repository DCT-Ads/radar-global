export type MarketplaceSource = "muncheye" | "warriorplus" | "clickbank" | "jvzoo";

export type MarketplaceStatus = "upcoming" | "live" | "evergreen";

export type MarketplaceLaunch = {
  source: MarketplaceSource;
  product_name: string;
  vendor: string | null;
  launch_date: string | null;
  status: MarketplaceStatus;
  niche: string | null;
  keyword?: string | null;
  url: string;
  raw_scraped_at: string;
};

export type MarketplaceCollectResult = {
  source: MarketplaceSource;
  items: MarketplaceLaunch[];
  listed?: number;
  errors: string[];
  httpStatus: number | null;
  finalUrl: string | null;
  emptyReason: string | null;
};

export function emptyResult(
  source: MarketplaceSource,
  extra: Partial<MarketplaceCollectResult> = {},
): MarketplaceCollectResult {
  return {
    source,
    items: [],
    errors: [],
    httpStatus: null,
    finalUrl: null,
    emptyReason: null,
    ...extra,
  };
}

export function statusFromLaunchDate(iso: string | null): MarketplaceStatus {
  if (!iso) {
    return "evergreen";
  }
  const day = iso.slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  return day > today ? "upcoming" : "live";
}

export function dedupeLaunches(items: MarketplaceLaunch[]): MarketplaceLaunch[] {
  const seen = new Set<string>();
  const out: MarketplaceLaunch[] = [];
  for (const item of items) {
    const key = `${item.source}\0${item.product_name.toLowerCase()}\0${item.launch_date ?? ""}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push(item);
  }
  return out;
}
