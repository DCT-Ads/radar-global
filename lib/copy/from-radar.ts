export type CopyContext = {
  why?: string | null;
  market?: string | null;
  stage?: string | null;
  format?: string | null;
};

export function copyFromRadarHref(
  produto: string,
  nicho?: string | null,
  context?: CopyContext,
): string {
  const params = new URLSearchParams();
  const name = produto.trim();
  if (name) params.set("produto", name);
  const niche = nicho?.trim();
  if (niche) params.set("nicho", niche);
  const why = context?.why?.trim();
  if (why) params.set("why", why);
  const market = context?.market?.trim();
  if (market) params.set("market", market);
  const stage = context?.stage?.trim();
  if (stage) params.set("stage", stage);
  const format = context?.format?.trim();
  if (format) params.set("format", format);
  const query = params.toString();
  return query ? `/copy?${query}` : "/copy";
}
