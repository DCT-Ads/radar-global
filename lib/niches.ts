export const NICHES: Record<string, string[]> = {
  health: ["keto", "weightloss", "detox", "supplement"],
  finance: ["crypto", "forex", "trading", "invest"],
  tech: ["vpn", "aitool", "saas", "software"],
  beauty: ["skincare", "antiaging", "collagen"],
};

export const ALL_KEYWORDS = Object.values(NICHES).flat();

export function nicheForKeyword(keyword: string): string | null {
  const needle = keyword.toLowerCase();
  for (const [niche, keywords] of Object.entries(NICHES)) {
    if (keywords.includes(needle)) {
      return niche;
    }
  }
  return null;
}
