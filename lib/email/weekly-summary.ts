import { CLAUDE_MODEL, createAnthropicClient } from "@/lib/ai/anthropic";
import { hasPaidAccess } from "@/lib/auth/access";
import {
  formatRadarContextForPrompt,
  getRadarChatContext,
  type RadarChatContext,
} from "@/lib/chat/radar-context";
import { emailLocale } from "@/lib/email/weekly-copy";
import { sendResendEmail, getResendApiKey } from "@/lib/email/resend";
import { renderWeeklySummaryEmail, type WeeklyBrief } from "@/lib/email/weekly-template";
import { listMonitoredLaunches, type MonitoredLaunchRow } from "@/lib/favorites/monitor";
import { prisma } from "@/lib/prisma";
import type { Locale } from "@/i18n/routing";

const BATCH_SIZE = 5;
const BATCH_GAP_MS = 400;

export type WeeklySummaryResult = {
  eligible: number;
  sent: number;
  failed: number;
  skipped: number;
  dryRun: boolean;
  briefSource: "ai" | "fallback" | "none";
  errors: { email: string; error: string }[];
  previews: {
    locale: string;
    hasFavorites: boolean;
    changedThisWeek: number;
    headline: string;
    hasMonitoradosSection: boolean;
    citesNumbers: boolean;
  }[];
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fallbackBrief(context: RadarChatContext, locale: Locale): WeeklyBrief {
  const topOpportunity = context.opportunityNiches[0]?.niche ?? "—";
  const saturating = context.topNichesByVolume.filter((row) => row.saturation === "Saturado").length;
  const emerging = context.opportunityNiches.length;
  const growth =
    context.last7GrowthPct === null ? "—" : `${context.last7GrowthPct}%`;

  if (locale === "en") {
    return {
      source: "fallback",
      headline: "This week on Radar Global",
      paragraphs: [
        `This week: ${saturating} high-volume niches look saturated, ${emerging} still look like opportunities, and the top watch is ${topOpportunity}.`,
        `The Radar counted ${context.last7Days} active signals in the last 7 days (${growth} vs the previous week). Totals: Hot ${context.saturation.hot}, Moderate ${context.saturation.moderate}, Saturated ${context.saturation.saturated}.`,
      ],
      bullets: [
        `Active signals: ${context.active}`,
        ...context.opportunityNiches.slice(0, 3).map(
          (row) =>
            `${row.niche}: avg confidence ${row.avgConfidence}, last 7d ${row.last7}, saturation ${row.saturation}`,
        ),
      ],
    };
  }

  if (locale === "es") {
    return {
      source: "fallback",
      headline: "Esta semana en Radar Global",
      paragraphs: [
        `Esta semana: ${saturating} nichos de alto volumen se ven saturados, ${emerging} siguen como oportunidad, y el primero a observar es ${topOpportunity}.`,
        `El Radar contó ${context.last7Days} señales activas en los últimos 7 días (${growth} vs la semana anterior). Totales: Hot ${context.saturation.hot}, Moderado ${context.saturation.moderate}, Saturado ${context.saturation.saturated}.`,
      ],
      bullets: [
        `Señales activas: ${context.active}`,
        ...context.opportunityNiches.slice(0, 3).map(
          (row) =>
            `${row.niche}: confianza media ${row.avgConfidence}, últimos 7d ${row.last7}, saturación ${row.saturation}`,
        ),
      ],
    };
  }

  return {
    source: "fallback",
    headline: "Essa semana no Radar Global",
    paragraphs: [
      `Essa semana: ${saturating} nichos de alto volume estão saturando, ${emerging} ainda aparecem como oportunidade, e a principal a observar é ${topOpportunity}.`,
      `O Radar contou ${context.last7Days} sinais ativos nos últimos 7 dias (${growth} vs a semana anterior). Totais: Hot ${context.saturation.hot}, Moderado ${context.saturation.moderate}, Saturado ${context.saturation.saturated}.`,
    ],
    bullets: [
      `Sinais ativos: ${context.active}`,
      ...context.opportunityNiches.slice(0, 3).map(
        (row) =>
          `${row.niche}: confiança média ${row.avgConfidence}, últimos 7d ${row.last7}, saturação ${row.saturation}`,
      ),
    ],
  };
}

function extractJsonPayload(text: string): unknown {
  const trimmed = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start < 0 || end <= start) {
      return null;
    }
    try {
      return JSON.parse(trimmed.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}

function parseBriefJson(text: string): Omit<WeeklyBrief, "source"> | null {
  const parsed = extractJsonPayload(text);
  if (!parsed || typeof parsed !== "object") {
    return null;
  }
  const headline =
    "headline" in parsed && typeof parsed.headline === "string" ? parsed.headline.trim() : "";
  const paragraphs = Array.isArray((parsed as { paragraphs?: unknown }).paragraphs)
    ? (parsed as { paragraphs: unknown[] }).paragraphs.filter(
        (item): item is string => typeof item === "string" && item.trim().length > 0,
      )
    : [];
  const bullets = Array.isArray((parsed as { bullets?: unknown }).bullets)
    ? (parsed as { bullets: unknown[] }).bullets.filter(
        (item): item is string => typeof item === "string" && item.trim().length > 0,
      )
    : [];
  if (!headline || paragraphs.length === 0) {
    return null;
  }
  return { headline, paragraphs, bullets };
}

async function generateWeeklyBrief(
  context: RadarChatContext,
  locale: Locale,
): Promise<WeeklyBrief> {
  const fallback = fallbackBrief(context, locale);
  const anthropic = createAnthropicClient();
  if (!anthropic) {
    console.warn("[weekly-summary] Anthropic missing, using fallback brief");
    return fallback;
  }

  const language =
    locale === "en" ? "English" : locale === "es" ? "Spanish" : "Brazilian Portuguese";

  try {
    const msg = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 700,
      system: [
        "You write the Radar Global weekly briefing for affiliates.",
        "Use only the snapshot numbers. Do not invent data. Do not promise income.",
        `Write in ${language}.`,
        "Reply with JSON only: {\"headline\":\"...\",\"paragraphs\":[\"...\"],\"bullets\":[\"...\"]}",
        "Style: short and direct, like: This week: X niches saturating, Y emerging, top opportunity is Z.",
      ].join(" "),
      messages: [
        {
          role: "user",
          content: `${formatRadarContextForPrompt(context)}\n\nReturn JSON only. No markdown.`,
        },
      ],
    });
    const text = msg.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("");
    const parsed = parseBriefJson(text);
    if (!parsed) {
      console.warn(
        "[weekly-summary] invalid AI JSON, using fallback",
        text.replace(/\s+/g, " ").slice(0, 240),
      );
      return fallback;
    }
    return { ...parsed, source: "ai" };
  } catch (error) {
    console.error("[weekly-summary] AI brief failed", error);
    return fallback;
  }
}

async function listEligibleUsers() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      locale: true,
      role: true,
      plan: true,
      subscription: {
        select: {
          status: true,
          plan: { select: { slug: true } },
        },
      },
    },
  });
  return users.filter((user) => hasPaidAccess(user));
}

function chunk<T>(items: T[], size: number): T[][] {
  const groups: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    groups.push(items.slice(i, i + size));
  }
  return groups;
}

export async function runWeeklySummary(options?: {
  dryRun?: boolean;
  limit?: number;
}): Promise<WeeklySummaryResult> {
  const dryRun = Boolean(options?.dryRun);
  const context = await getRadarChatContext();
  const users = (await listEligibleUsers()).slice(
    0,
    options?.limit && options.limit > 0 ? options.limit : undefined,
  );

  const result: WeeklySummaryResult = {
    eligible: users.length,
    sent: 0,
    failed: 0,
    skipped: 0,
    dryRun,
    briefSource: "none",
    errors: [],
    previews: [],
  };

  if (users.length === 0) {
    return result;
  }

  const locales = [...new Set(users.map((user) => emailLocale(user.locale)))];
  const briefs = new Map<Locale, WeeklyBrief>();
  for (const locale of locales) {
    const brief = await generateWeeklyBrief(context, locale);
    briefs.set(locale, brief);
    result.briefSource = brief.source;
  }

  const canSend = Boolean(getResendApiKey()) && !dryRun;
  if (!getResendApiKey() && !dryRun) {
    console.error("[weekly-summary] RESEND_API_KEY is not set");
  }

  const usersWithFavorites = new Set(
    (
      await prisma.favorite.findMany({
        where: { userId: { in: users.map((user) => user.id) } },
        select: { userId: true },
        distinct: ["userId"],
      })
    ).map((row) => row.userId),
  );

  const monitoradosByUser = new Map<string, MonitoredLaunchRow[]>();
  for (const user of users) {
    if (!usersWithFavorites.has(user.id)) {
      monitoradosByUser.set(user.id, []);
      continue;
    }
    try {
      monitoradosByUser.set(user.id, await listMonitoredLaunches(user.id));
    } catch (error) {
      console.error("[weekly-summary] monitorados failed", user.email, error);
      monitoradosByUser.set(user.id, []);
    }
  }

  for (const group of chunk(users, BATCH_SIZE)) {
    for (const user of group) {
      const brief = briefs.get(emailLocale(user.locale));
      if (!brief) {
        result.skipped += 1;
        continue;
      }
      const monitorados = monitoradosByUser.get(user.id) ?? [];
      const email = renderWeeklySummaryEmail({
        name: user.name || user.email,
        locale: user.locale,
        brief,
        monitorados,
      });
      if (result.previews.length < 3) {
        result.previews.push({
          locale: emailLocale(user.locale),
          hasFavorites: monitorados.length > 0,
          changedThisWeek: monitorados.filter((row) => row.changedThisWeek).length,
          headline: brief.headline,
          hasMonitoradosSection:
            email.html.includes("Seus Monitorados") ||
            email.html.includes("Your Watchlist") ||
            email.html.includes("Tus Monitorizados"),
          citesNumbers: /\d/.test(brief.paragraphs.join(" ") + brief.bullets.join(" ")),
        });
      }

      if (!canSend) {
        result.skipped += 1;
        console.info("[weekly-summary] skipped send", {
          email: user.email,
          dryRun,
          hasFavorites: monitorados.length > 0,
          changed: monitorados.filter((row) => row.changedThisWeek).length,
        });
        continue;
      }

      try {
        const sent = await sendResendEmail({
          to: user.email,
          subject: email.subject,
          html: email.html,
        });
        if (sent.error) {
          result.failed += 1;
          result.errors.push({ email: user.email, error: sent.error });
          console.error("[weekly-summary] send failed", user.email, sent.error);
          await prisma.auditLog.create({
            data: {
              userId: user.id,
              action: "weekly_summary_failed",
              entity: "User",
              entityId: user.id,
              metadata: { error: sent.error },
            },
          });
          continue;
        }
        result.sent += 1;
        console.info("[weekly-summary] sent", user.email, sent.id);
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: "weekly_summary_sent",
            entity: "User",
            entityId: user.id,
            metadata: { resendId: sent.id },
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "send_failed";
        result.failed += 1;
        result.errors.push({ email: user.email, error: message });
        console.error("[weekly-summary] send exception", user.email, error);
      }
    }
    await sleep(BATCH_GAP_MS);
  }

  return result;
}

export async function previewWeeklySummary(userId: string) {
  const context = await getRadarChatContext();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, locale: true },
  });
  if (!user) {
    return null;
  }
  const brief = await generateWeeklyBrief(context, emailLocale(user.locale));
  const monitorados = await listMonitoredLaunches(userId);
  return renderWeeklySummaryEmail({
    name: user.name || user.email,
    locale: user.locale,
    brief,
    monitorados,
  });
}
