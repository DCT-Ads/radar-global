import { prisma } from "@/lib/prisma";
import {
  getSaturationLevel,
  indexKeywordVolumes,
  type SaturationLevel,
} from "@/lib/signals/saturation";

const CACHE_MS = 8 * 60 * 1000;

export type SaturationLabel = "Hot" | "Moderado" | "Saturado";

export type NicheSnapshot = {
  niche: string;
  total: number;
  last7: number;
  previous7: number;
  growthPct: number | null;
  avgConfidence: number;
  saturation: SaturationLabel;
  hot: number;
  moderate: number;
  saturated: number;
};

export type RecentSignalSnapshot = {
  domain: string;
  niche: string | null;
  keyword: string | null;
  source: string;
  confidence: number;
  saturation: SaturationLabel | null;
  discoveredAt: string;
};

export type RadarChatContext = {
  generatedAt: string;
  total: number;
  active: number;
  last7Days: number;
  previous7Days: number;
  last7GrowthPct: number | null;
  saturation: {
    hot: number;
    moderate: number;
    saturated: number;
    unlabeled: number;
  };
  topNichesByVolume: NicheSnapshot[];
  opportunityNiches: NicheSnapshot[];
  recentByScore: RecentSignalSnapshot[];
  niches: NicheSnapshot[];
  notes: string[];
};

type CacheEntry = { expiresAt: number; value: RadarChatContext };

let cache: CacheEntry | null = null;
let inflight: Promise<RadarChatContext> | null = null;

const emptySaturation = (): Record<SaturationLevel, number> => ({
  SAFE: 0,
  WARNING: 0,
  SATURATED: 0,
});

export function saturationLabel(level: SaturationLevel | null): SaturationLabel | null {
  if (level === "SAFE") {
    return "Hot";
  }
  if (level === "WARNING") {
    return "Moderado";
  }
  if (level === "SATURATED") {
    return "Saturado";
  }
  return null;
}

function dominantSaturation(counts: Record<SaturationLevel, number>): SaturationLabel {
  if (counts.SATURATED >= counts.WARNING && counts.SATURATED >= counts.SAFE && counts.SATURATED > 0) {
    return "Saturado";
  }
  if (counts.WARNING >= counts.SAFE && counts.WARNING > 0) {
    return "Moderado";
  }
  if (counts.SAFE > 0) {
    return "Hot";
  }
  return "Moderado";
}

function growthPct(current: number, previous: number): number | null {
  if (previous <= 0) {
    return current > 0 ? null : 0;
  }
  return Math.round(((current - previous) / previous) * 100);
}

function roundAvg(value: number | null | undefined): number {
  return Math.round((value ?? 0) * 10) / 10;
}

async function buildRadarChatContext(): Promise<RadarChatContext> {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const activeWhere = { status: { not: "DISCARDED" as const } };

  const [
    total,
    active,
    last7Days,
    previous7Days,
    keywordCounts,
    nicheTotals,
    nicheLast7,
    nichePrev7,
    nicheKeywords,
    recentRows,
  ] = await Promise.all([
    prisma.signal.count(),
    prisma.signal.count({ where: activeWhere }),
    prisma.signal.count({
      where: { ...activeWhere, discoveredAt: { gte: weekAgo } },
    }),
    prisma.signal.count({
      where: {
        ...activeWhere,
        discoveredAt: { gte: twoWeeksAgo, lt: weekAgo },
      },
    }),
    prisma.signal.groupBy({
      by: ["keyword"],
      where: activeWhere,
      _count: { _all: true },
    }),
    prisma.signal.groupBy({
      by: ["niche"],
      where: { ...activeWhere, niche: { not: null } },
      _count: { _all: true },
      _avg: { confidence: true },
    }),
    prisma.signal.groupBy({
      by: ["niche"],
      where: {
        ...activeWhere,
        niche: { not: null },
        discoveredAt: { gte: weekAgo },
      },
      _count: { _all: true },
    }),
    prisma.signal.groupBy({
      by: ["niche"],
      where: {
        ...activeWhere,
        niche: { not: null },
        discoveredAt: { gte: twoWeeksAgo, lt: weekAgo },
      },
      _count: { _all: true },
    }),
    prisma.signal.groupBy({
      by: ["niche", "keyword"],
      where: { ...activeWhere, niche: { not: null } },
      _count: { _all: true },
    }),
    prisma.signal.findMany({
      where: { ...activeWhere, discoveredAt: { gte: weekAgo } },
      orderBy: [{ confidence: "desc" }, { discoveredAt: "desc" }],
      take: 15,
      select: {
        domain: true,
        value: true,
        niche: true,
        keyword: true,
        source: true,
        confidence: true,
        discoveredAt: true,
      },
    }),
  ]);

  const { byKeyword, median, p75 } = indexKeywordVolumes(keywordCounts);
  const saturationTally = emptySaturation();
  let unlabeled = 0;

  for (const row of keywordCounts) {
    const level = getSaturationLevel({
      keyword: row.keyword,
      keywordVolume: row.keyword ? (byKeyword[row.keyword] ?? row._count._all) : 0,
      medianVolume: median,
      p75Volume: p75,
      confidence: 50,
      firstSeenDaysAgo: 0,
    });
    if (level) {
      saturationTally[level] += row._count._all;
    } else {
      unlabeled += row._count._all;
    }
  }

  const last7ByNiche = new Map(
    nicheLast7.map((row) => [row.niche ?? "", row._count._all]),
  );
  const prev7ByNiche = new Map(
    nichePrev7.map((row) => [row.niche ?? "", row._count._all]),
  );
  const nicheSat = new Map<string, Record<SaturationLevel, number>>();

  for (const row of nicheKeywords) {
    const niche = row.niche;
    if (!niche) {
      continue;
    }
    const counts = nicheSat.get(niche) ?? emptySaturation();
    const level = getSaturationLevel({
      keyword: row.keyword,
      keywordVolume: row.keyword ? (byKeyword[row.keyword] ?? row._count._all) : 0,
      medianVolume: median,
      p75Volume: p75,
      confidence: 50,
      firstSeenDaysAgo: 0,
    });
    if (level) {
      counts[level] += row._count._all;
    }
    nicheSat.set(niche, counts);
  }

  const niches: NicheSnapshot[] = nicheTotals
    .map((row) => {
      const niche = row.niche ?? "—";
      const counts = nicheSat.get(niche) ?? emptySaturation();
      const last7 = last7ByNiche.get(niche) ?? 0;
      const previous7 = prev7ByNiche.get(niche) ?? 0;
      return {
        niche,
        total: row._count._all,
        last7,
        previous7,
        growthPct: growthPct(last7, previous7),
        avgConfidence: roundAvg(row._avg.confidence),
        saturation: dominantSaturation(counts),
        hot: counts.SAFE,
        moderate: counts.WARNING,
        saturated: counts.SATURATED,
      };
    })
    .sort((a, b) => b.total - a.total);

  const opportunityNiches = [...niches]
    .filter(
      (row) =>
        row.saturation !== "Saturado" &&
        row.hot + row.moderate + row.saturated > 0 &&
        (row.last7 >= 2 || row.total >= 8),
    )
    .sort((a, b) => {
      if (b.avgConfidence !== a.avgConfidence) {
        return b.avgConfidence - a.avgConfidence;
      }
      if (b.last7 !== a.last7) {
        return b.last7 - a.last7;
      }
      return a.saturated - b.saturated;
    })
    .slice(0, 5);

  const recentByScore: RecentSignalSnapshot[] = recentRows.map((row) => {
    const level = getSaturationLevel({
      keyword: row.keyword,
      keywordVolume: row.keyword ? (byKeyword[row.keyword] ?? 1) : 0,
      medianVolume: median,
      p75Volume: p75,
      confidence: row.confidence,
      firstSeenDaysAgo: 0,
    });
    return {
      domain: row.domain || row.value,
      niche: row.niche,
      keyword: row.keyword,
      source: row.source,
      confidence: row.confidence,
      saturation: saturationLabel(level),
      discoveredAt: row.discoveredAt.toISOString().slice(0, 10),
    };
  });

  return {
    generatedAt: now.toISOString(),
    total,
    active,
    last7Days,
    previous7Days,
    last7GrowthPct: growthPct(last7Days, previous7Days),
    saturation: {
      hot: saturationTally.SAFE,
      moderate: saturationTally.WARNING,
      saturated: saturationTally.SATURATED,
      unlabeled,
    },
    topNichesByVolume: niches.slice(0, 5),
    opportunityNiches,
    recentByScore,
    niches: niches.slice(0, 20),
    notes: [
      "Saturação não é um campo persistido: Hot=SAFE, Moderado=WARNING, Saturado=SATURATED, calculado por volume da palavra-chave (mesma regra do dashboard).",
      "Não há histórico de estágio Emergente→Hot no schema; esse item foi omitido.",
      "Sinais com status DISCARDED entram só no total geral, não nas contagens ativas.",
    ],
  };
}

export async function getRadarChatContext(): Promise<RadarChatContext> {
  if (cache && Date.now() < cache.expiresAt) {
    return cache.value;
  }
  if (inflight) {
    return inflight;
  }
  inflight = buildRadarChatContext()
    .then((value) => {
      cache = { expiresAt: Date.now() + CACHE_MS, value };
      return value;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export async function getRadarChatContextSafe(): Promise<RadarChatContext | null> {
  try {
    return await getRadarChatContext();
  } catch (error) {
    console.error("[chat] radar context failed", error);
    return null;
  }
}

function nicheLine(row: NicheSnapshot): string {
  const growth =
    row.growthPct === null ? "sem base na semana anterior" : `${row.growthPct}% vs semana anterior`;
  return `- ${row.niche}: ${row.total} sinais, confiança média ${row.avgConfidence}, últimos 7d ${row.last7} (${growth}), saturação ${row.saturation} (Hot ${row.hot} / Moderado ${row.moderate} / Saturado ${row.saturated})`;
}

export function formatRadarContextForPrompt(context: RadarChatContext | null): string {
  if (!context) {
    return [
      "SNAPSHOT DOS SINAIS: indisponível neste momento.",
      "Não cite números específicos do Radar. Diga que os dados ao vivo não puderam ser carregados e continue de forma útil, sem inventar estatísticas.",
    ].join("\n");
  }

  const growth =
    context.last7GrowthPct === null
      ? "sem base comparável na semana anterior"
      : `${context.last7GrowthPct}% vs os 7 dias anteriores`;

  const opportunities =
    context.opportunityNiches.length > 0
      ? context.opportunityNiches.map(nicheLine).join("\n")
      : "- Nenhuma oportunidade clara (nichos com boa confiança e saturação não saturada) neste recorte.";

  const recent =
    context.recentByScore.length > 0
      ? context.recentByScore
          .map(
            (row) =>
              `- ${row.domain} | nicho ${row.niche ?? "—"} | kw ${row.keyword ?? "—"} | fonte ${row.source} | confiança ${row.confidence} | ${row.saturation ?? "sem saturação"} | ${row.discoveredAt}`,
          )
          .join("\n")
      : "- Nenhum sinal ativo descoberto nos últimos 7 dias.";

  return [
    `SNAPSHOT DOS SINAIS (gerado em ${context.generatedAt}, cache ~8 min)`,
    `Total no banco: ${context.total}. Ativos (não descartados): ${context.active}.`,
    `Saturação dos ativos: Hot ${context.saturation.hot}, Moderado ${context.saturation.moderate}, Saturado ${context.saturation.saturated}, sem classificação ${context.saturation.unlabeled}.`,
    `Últimos 7 dias: ${context.last7Days} sinais (vs ${context.previous7Days} nos 7 dias anteriores, ${growth}).`,
    "",
    "Top 5 nichos por volume:",
    ...context.topNichesByVolume.map(nicheLine),
    "",
    "Top oportunidades (melhor confiança média e saturação não saturada):",
    opportunities,
    "",
    "Sinais dos últimos 7 dias, ordenados por confiança:",
    recent,
    "",
    "Nichos para perguntas específicas:",
    ...context.niches.map(nicheLine),
    "",
    "Notas:",
    ...context.notes.map((note) => `- ${note}`),
  ].join("\n");
}

export function buildChatSystemPrompt(context: RadarChatContext | null): string {
  return [
    "Você é o consultor do Radar Global, um SaaS de monitoramento de lançamentos digitais para afiliados.",
    "Sempre responda com base nos dados fornecidos no contexto abaixo.",
    "Cite números reais quando possível (totais, nichos, confiança, saturação, variação da semana).",
    "Se não houver dado suficiente para responder, diga isso claramente em vez de inventar informação.",
    "Não invente nichos, scores, volumes, fontes ou status que não apareçam no snapshot.",
    "Saturação: Hot = baixa saturação (SAFE), Moderado = WARNING, Saturado = SATURATED.",
    "Não existe tabela de histórico de estágio Emergente→Hot; não afirme transições históricas.",
    "Responda no idioma da pergunta do usuário. Seja direto e útil para decidir onde observar, sem prometer renda.",
    "",
    formatRadarContextForPrompt(context),
  ].join("\n");
}
