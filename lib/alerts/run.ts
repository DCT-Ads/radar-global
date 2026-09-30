import { Prisma } from "@prisma/client";
import type { Locale } from "@/i18n/routing";
import { hasPaidAccess, hasPremiumAccess } from "@/lib/auth/access";
import {
  draftsForWatch,
  quietDue,
  relatedDraft,
  shouldSendQuietDigest,
  zonedClock,
  type AlertSensitivity,
  type NoticeDraft,
} from "@/lib/alerts/evaluate";
import { deliverAlert, normalizeChannel } from "@/lib/alerts/deliver";
import { renderChangeEmail, renderDigestEmail } from "@/lib/alerts/email";
import { emailLocale } from "@/lib/email/weekly-copy";
import { listMonitoredLaunches } from "@/lib/favorites/monitor";
import { prisma } from "@/lib/prisma";

export type AlertRunResult = {
  users: number;
  seeded: number;
  notices: number;
  emails: number;
  digests: number;
  quiet: number;
  whatsappPending: number;
  failed: number;
  dryRun: boolean;
};

function sensitivityOf(value: string): AlertSensitivity {
  return value === "HOT_ONLY" ? "HOT_ONLY" : "ALL";
}

async function insertDrafts(userId: string, drafts: NoticeDraft[], dryRun: boolean) {
  if (dryRun) return drafts;
  const created: NoticeDraft[] = [];
  for (const draft of drafts) {
    try {
      await prisma.inboxNotice.create({
        data: {
          userId,
          launchId: draft.launchId,
          kind: draft.kind,
          dedupeKey: draft.dedupeKey,
          title: draft.title,
          body: draft.body,
          href: draft.href,
          fromStage: draft.fromStage,
          toStage: draft.toStage,
        },
      });
      created.push(draft);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        continue;
      }
      throw error;
    }
  }
  return created;
}

export async function runAlertSweep(options?: {
  now?: Date;
  dryRun?: boolean;
  limit?: number;
}): Promise<AlertRunResult> {
  const now = options?.now ?? new Date();
  const dryRun = options?.dryRun === true;
  const limit = options?.limit ?? 100;
  const result: AlertRunResult = {
    users: 0,
    seeded: 0,
    notices: 0,
    emails: 0,
    digests: 0,
    quiet: 0,
    whatsappPending: 0,
    failed: 0,
    dryRun,
  };

  const users = await prisma.user.findMany({
    where: {
      favorites: { some: {} },
      OR: [
        { role: "ADMIN" },
        { subscription: { is: { status: "ACTIVE", plan: { slug: { not: "FREE" } } } } },
      ],
    },
    select: {
      id: true,
      email: true,
      name: true,
      locale: true,
      role: true,
      plan: true,
      subscription: { select: { status: true, plan: { select: { slug: true } } } },
    },
    take: limit,
  });

  for (const user of users) {
    if (!hasPaidAccess(user)) continue;
    result.users += 1;
    const locale: Locale = emailLocale(user.locale);
    const premium = hasPremiumAccess(user);
    const pref = dryRun
      ? await prisma.alertPreference.findUnique({ where: { userId: user.id } })
      : await prisma.alertPreference.upsert({
          where: { userId: user.id },
          update: {},
          create: { userId: user.id },
        });
    const stageAlerts = pref?.stageAlerts ?? true;
    const digestEnabled = (pref?.digestEnabled ?? true) && premium;
    const channel = normalizeChannel(pref?.channel);
    const sensitivity = sensitivityOf(pref?.sensitivity ?? "ALL");
    const clock = zonedClock(now, pref?.timezone ?? "America/Sao_Paulo");

    try {
      const monitored = await listMonitoredLaunches(user.id);
      const snaps = await prisma.favorite.findMany({
        where: { userId: user.id },
        select: { launchId: true, lastSaturation: true, lastEarlySignal: true },
      });
      const snapById = new Map(snaps.map((row) => [row.launchId, row]));
      const drafts: NoticeDraft[] = [];

      for (const row of monitored) {
        const snap = snapById.get(row.id);
        const watched = {
          launchId: row.id,
          title: row.title,
          niche: row.niche,
          saturation: row.saturation,
          earlySignal: row.earlySignal,
          lastSaturation: snap?.lastSaturation ?? null,
          lastEarlySignal: snap?.lastEarlySignal ?? null,
        };
        if (stageAlerts) {
          const next = draftsForWatch(watched, sensitivity, locale);
          drafts.push(
            ...next.filter((draft) => draft.kind === "stage" || (digestEnabled && draft.kind === "growth")),
          );
        }
        const seen = watched.lastSaturation !== null || watched.lastEarlySignal !== null;
        if (!seen) result.seeded += 1;
        if (!dryRun) {
          await prisma.favorite.update({
            where: { userId_launchId: { userId: user.id, launchId: row.id } },
            data: {
              lastSaturation: row.saturation,
              lastEarlySignal: row.earlySignal,
            },
          });
        }
      }

      if (digestEnabled) {
        const niches = [...new Set(monitored.map((row) => row.niche).filter((niche): niche is string => Boolean(niche)))];
        if (niches.length > 0) {
          const fresh = await prisma.launch.findMany({
            where: {
              niche: { in: niches },
              createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
              id: { notIn: monitored.map((row) => row.id) },
            },
            select: { id: true, title: true, niche: true },
            take: 5,
          });
          for (const launch of fresh) {
            if (!launch.niche) continue;
            drafts.push(
              relatedDraft({
                launchId: launch.id,
                title: launch.title,
                niche: launch.niche,
                locale,
              }),
            );
          }
        }
      }

      const immediate = drafts.filter((draft) => draft.kind === "stage");
      const createdImmediate = await insertDrafts(user.id, immediate, dryRun);
      const createdDigestOnly = await insertDrafts(
        user.id,
        drafts.filter((draft) => draft.kind === "growth" || draft.kind === "related"),
        dryRun,
      );
      result.notices += createdImmediate.length + createdDigestOnly.length;

      if (createdImmediate.length > 0 && !dryRun) {
        const mail = renderChangeEmail({ locale, name: user.name, items: createdImmediate });
        const sent = await deliverAlert({
          channel,
          premium,
          to: user.email,
          whatsappOptIn: Boolean(pref?.whatsappOptIn),
          subject: mail.subject,
          html: mail.html,
        });
        if (sent.whatsapp === "not_configured") result.whatsappPending += 1;
        if (sent.email === "sent") {
          result.emails += 1;
          await prisma.inboxNotice.updateMany({
            where: { userId: user.id, dedupeKey: { in: createdImmediate.map((item) => item.dedupeKey) } },
            data: { emailedAt: now },
          });
        }
        if (sent.email === "failed") result.failed += 1;
      }

      if (digestEnabled && pref?.lastDigestKey !== clock.dayKey) {
        const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const recent = dryRun
          ? [...createdImmediate, ...createdDigestOnly]
          : await prisma.inboxNotice.findMany({
              where: { userId: user.id, createdAt: { gte: since } },
              orderBy: { createdAt: "desc" },
              take: 12,
            });
        if (recent.length > 0 && !dryRun) {
          const mail = renderDigestEmail({
            locale,
            name: user.name,
            quiet: false,
            items: recent.map((item) => ({ title: item.title, body: item.body, href: item.href })),
          });
          const sent = await deliverAlert({
            channel,
            premium,
            to: user.email,
            whatsappOptIn: Boolean(pref?.whatsappOptIn),
            subject: mail.subject,
            html: mail.html,
          });
          if (sent.email === "sent") result.digests += 1;
          if (sent.email === "failed") result.failed += 1;
          if (sent.whatsapp === "not_configured") result.whatsappPending += 1;
        } else if (
          !dryRun &&
          shouldSendQuietDigest({
            premium,
            digestEnabled,
            hasNews: recent.length > 0,
            quietIsDue: quietDue(pref?.quietNoteSentAt ?? null, now),
          })
        ) {
          const mail = renderDigestEmail({ locale, name: user.name, quiet: true, items: [] });
          const sent = await deliverAlert({
            channel,
            premium,
            to: user.email,
            whatsappOptIn: false,
            subject: mail.subject,
            html: mail.html,
          });
          if (sent.email === "sent") result.quiet += 1;
          await prisma.alertPreference.update({
            where: { userId: user.id },
            data: { quietNoteSentAt: now, lastDigestKey: clock.dayKey },
          });
          continue;
        }
        if (!dryRun) {
          await prisma.alertPreference.update({
            where: { userId: user.id },
            data: { lastDigestKey: clock.dayKey },
          });
        }
      }
    } catch (error) {
      result.failed += 1;
      console.error("[alerts] user failed", user.email, error);
    }
  }

  return result;
}
