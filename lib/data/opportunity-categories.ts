import type { MomentumStage } from "@/lib/data/momentum";

export type OpportunityIconName =
  | "Brain"
  | "Bot"
  | "Wallet"
  | "HeartPulse"
  | "Target"
  | "Rocket";

export type MarketCode = "US" | "UK" | "AU" | "BR";

export type OpportunityFormat =
  | "course"
  | "community"
  | "mentorship"
  | "ebook"
  | "app"
  | "newsletter"
  | "aiProduct";

export type OpportunityCategoryId =
  | "mente-performance"
  | "ia-futuro"
  | "dinheiro-carreira"
  | "wellness-longevidade"
  | "comportamento-lifestyle"
  | "creator-infoprodutos";

export type InterestPoint = {
  month: string;
  value: number;
};

export type OpportunityCategory = {
  id: OpportunityCategoryId;
  icon: OpportunityIconName;
  stage: MomentumStage;
  markets: MarketCode[];
  formats: OpportunityFormat[];
  source: string;
  trendQuery: string;
  wikiArticle: string;
  redditQuery: string;
  interest: InterestPoint[];
  deltaPct?: number;
  live?: boolean;
};

export const MARKET_FLAGS: Record<MarketCode, string> = {
  US: "🇺🇸",
  UK: "🇬🇧",
  AU: "🇦🇺",
  BR: "🇧🇷",
};

export const ALL_OPPORTUNITY_FORMATS: OpportunityFormat[] = [
  "course",
  "community",
  "mentorship",
  "ebook",
  "app",
  "newsletter",
  "aiProduct",
];

export const OPPORTUNITY_CATEGORIES: OpportunityCategory[] = [
  {
    id: "mente-performance",
    icon: "Brain",
    stage: "ACELERANDO",
    markets: ["US", "UK", "AU", "BR"],
    formats: ALL_OPPORTUNITY_FORMATS,
    source: "Adobe Newsroom +1",
    trendQuery: "mental clarity",
    wikiArticle: "Productivity",
    redditQuery: "productivity",
    interest: [
      { month: "2026-04", value: 18 },
      { month: "2026-05", value: 24 },
      { month: "2026-06", value: 31 },
      { month: "2026-07", value: 44 },
      { month: "2026-08", value: 58 },
      { month: "2026-09", value: 72 },
    ],
  },
  {
    id: "ia-futuro",
    icon: "Bot",
    stage: "HOT",
    markets: ["US", "UK", "AU", "BR"],
    formats: ALL_OPPORTUNITY_FORMATS,
    source: "Google Trends",
    trendQuery: "AI agents",
    wikiArticle: "Intelligent_agent",
    redditQuery: "AI agents",
    interest: [
      { month: "2026-04", value: 40 },
      { month: "2026-05", value: 52 },
      { month: "2026-06", value: 61 },
      { month: "2026-07", value: 74 },
      { month: "2026-08", value: 86 },
      { month: "2026-09", value: 91 },
    ],
  },
  {
    id: "dinheiro-carreira",
    icon: "Wallet",
    stage: "EMERGENTE",
    markets: ["US", "BR", "UK"],
    formats: ["course", "community", "mentorship", "newsletter"],
    source: "Google Trends",
    trendQuery: "side hustle",
    wikiArticle: "Gig_economy",
    redditQuery: "side hustle",
    interest: [
      { month: "2026-04", value: 12 },
      { month: "2026-05", value: 14 },
      { month: "2026-06", value: 19 },
      { month: "2026-07", value: 23 },
      { month: "2026-08", value: 29 },
      { month: "2026-09", value: 36 },
    ],
  },
  {
    id: "wellness-longevidade",
    icon: "HeartPulse",
    stage: "ACELERANDO",
    markets: ["US", "AU", "UK", "BR"],
    formats: ALL_OPPORTUNITY_FORMATS,
    source: "Global Wellness Institute 2026",
    trendQuery: "longevity",
    wikiArticle: "Longevity",
    redditQuery: "longevity",
    interest: [
      { month: "2026-04", value: 22 },
      { month: "2026-05", value: 28 },
      { month: "2026-06", value: 35 },
      { month: "2026-07", value: 47 },
      { month: "2026-08", value: 59 },
      { month: "2026-09", value: 68 },
    ],
  },
  {
    id: "comportamento-lifestyle",
    icon: "Target",
    stage: "FRIO",
    markets: ["US", "UK"],
    formats: ["community", "newsletter", "ebook"],
    source: "Google Trends",
    trendQuery: "dopamine detox",
    wikiArticle: "Dopamine",
    redditQuery: "dopamine",
    interest: [
      { month: "2026-04", value: 16 },
      { month: "2026-05", value: 15 },
      { month: "2026-06", value: 17 },
      { month: "2026-07", value: 16 },
      { month: "2026-08", value: 18 },
      { month: "2026-09", value: 19 },
    ],
  },
  {
    id: "creator-infoprodutos",
    icon: "Rocket",
    stage: "SATURANDO",
    markets: ["US", "BR", "UK", "AU"],
    formats: ["course", "community", "ebook", "newsletter"],
    source: "Google Trends",
    trendQuery: "digital products",
    wikiArticle: "Influencer_marketing",
    redditQuery: "influencer",
    interest: [
      { month: "2026-04", value: 54 },
      { month: "2026-05", value: 61 },
      { month: "2026-06", value: 70 },
      { month: "2026-07", value: 78 },
      { month: "2026-08", value: 84 },
      { month: "2026-09", value: 88 },
    ],
  },
];
