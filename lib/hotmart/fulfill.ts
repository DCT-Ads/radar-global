import { randomBytes } from "node:crypto";
import { PlanSlug, Prisma, type AccessPlan } from "@prisma/client";
import { createPasswordSetupToken } from "@/lib/auth/password-reset";
import { hashPassword } from "@/lib/auth/password";
import { renderHotmartAccessEmail } from "@/lib/email/hotmart-access";
import { sendResendEmail } from "@/lib/email/resend";
import {
  accessLocale,
  periodEnd,
  planForOffer,
  type HotmartPurchase,
} from "@/lib/hotmart/webhook";
import { prisma } from "@/lib/prisma";

export type FulfillResult = {
  action: "granted" | "revoked" | "ignored" | "skipped";
  email: string;
  offer: string;
  transaction: string;
  event: string;
  plan?: AccessPlan;
  created?: boolean;
  emailSent?: boolean;
  reason?: string;
};

export async function fulfillHotmartPurchase(purchase: HotmartPurchase): Promise<FulfillResult> {
  const base = {
    email: purchase.email,
    offer: purchase.offerCode,
    transaction: purchase.transaction,
    event: purchase.event,
  };

  if (purchase.action === "ignore") {
    return { ...base, action: "ignored", reason: "event_ignored" };
  }

  if (purchase.action === "revoke") {
    return revokeAccess(purchase, base);
  }

  return grantAccess(purchase, base);
}

async function grantAccess(
  purchase: HotmartPurchase,
  base: Pick<FulfillResult, "email" | "offer" | "transaction" | "event">,
): Promise<FulfillResult> {
  const offer = planForOffer(purchase.offerCode);
  const paidSlug = offer.plan === "PREMIUM" ? PlanSlug.PREMIUM : PlanSlug.PRO;
  const paidPlan = await prisma.plan.findUnique({ where: { slug: paidSlug } });
  if (!paidPlan) {
    throw new Error("PLAN_NOT_SEEDED");
  }

  const existing = await prisma.user.findUnique({
    where: { email: purchase.email },
    select: { id: true, role: true, name: true, locale: true },
  });

  if (existing?.role === "ADMIN") {
    return { ...base, action: "skipped", plan: offer.plan, reason: "admin_unchanged" };
  }

  const start = purchase.approvedAt ?? new Date();
  const end = periodEnd(purchase, offer.months);
  const locale = accessLocale(purchase.currency);
  const name = buyerName(purchase.name, purchase.email);

  let created = false;
  let userId = existing?.id;

  if (!userId) {
    const passwordHash = await hashPassword(randomBytes(32).toString("hex"));
    try {
      const user = await prisma.user.create({
        data: {
          email: purchase.email,
          name,
          passwordHash,
          locale,
          plan: offer.plan,
          subscription: {
            create: {
              planId: paidPlan.id,
              status: "ACTIVE",
              currentPeriodStart: start,
              currentPeriodEnd: end,
            },
          },
        },
        select: { id: true },
      });
      userId = user.id;
      created = true;
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
        throw error;
      }
      const raced = await prisma.user.findUnique({
        where: { email: purchase.email },
        select: { id: true, role: true },
      });
      if (!raced || raced.role === "ADMIN") {
        return { ...base, action: "skipped", plan: offer.plan, reason: "admin_unchanged" };
      }
      userId = raced.id;
    }
  }

  if (!created && userId) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        plan: offer.plan,
        subscription: {
          upsert: {
            create: {
              planId: paidPlan.id,
              status: "ACTIVE",
              currentPeriodStart: start,
              currentPeriodEnd: end,
            },
            update: {
              planId: paidPlan.id,
              status: "ACTIVE",
              currentPeriodStart: start,
              currentPeriodEnd: end,
            },
          },
        },
      },
    });
  }

  if (!userId) {
    throw new Error("USER_MISSING");
  }

  await prisma.auditLog.create({
    data: {
      userId,
      action: "hotmart_purchase_approved",
      entity: "Subscription",
      entityId: userId,
      metadata: {
        event: purchase.event,
        offer: purchase.offerCode,
        transaction: purchase.transaction,
        plan: offer.plan,
        knownOffer: offer.known,
        periodEnd: end.toISOString(),
        created,
      },
    },
  });

  let emailSent = false;
  if (created) {
    emailSent = await sendSetupEmail({
      userId,
      email: purchase.email,
      name,
      locale,
    });
  }

  return {
    ...base,
    action: "granted",
    plan: offer.plan,
    created,
    emailSent,
    reason: offer.known ? undefined : "unknown_offer_defaults_standard",
  };
}

async function revokeAccess(
  purchase: HotmartPurchase,
  base: Pick<FulfillResult, "email" | "offer" | "transaction" | "event">,
): Promise<FulfillResult> {
  const user = await prisma.user.findUnique({
    where: { email: purchase.email },
    select: { id: true, role: true },
  });
  if (!user) {
    return { ...base, action: "skipped", reason: "user_not_found" };
  }
  if (user.role === "ADMIN") {
    return { ...base, action: "skipped", reason: "admin_unchanged" };
  }

  const freePlan = await prisma.plan.findUnique({ where: { slug: PlanSlug.FREE } });
  if (!freePlan) {
    throw new Error("PLAN_NOT_SEEDED");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      plan: "STANDARD",
      subscription: {
        upsert: {
          create: {
            planId: freePlan.id,
            status: "CANCELED",
            currentPeriodEnd: new Date(),
          },
          update: {
            planId: freePlan.id,
            status: "CANCELED",
            currentPeriodEnd: new Date(),
          },
        },
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "hotmart_access_revoked",
      entity: "Subscription",
      entityId: user.id,
      metadata: {
        event: purchase.event,
        offer: purchase.offerCode,
        transaction: purchase.transaction,
      },
    },
  });

  return { ...base, action: "revoked" };
}

async function sendSetupEmail(input: {
  userId: string;
  email: string;
  name: string;
  locale: string;
}) {
  const token = await createPasswordSetupToken(input.userId);
  const emailCopy = renderHotmartAccessEmail({
    name: input.name,
    locale: input.locale,
    token,
  });
  const sent = await sendResendEmail({
    to: input.email,
    subject: emailCopy.subject,
    html: emailCopy.html,
  });
  if (sent.error) {
    console.error("[hotmart-webhook] access email failed", input.email, sent.error);
    return false;
  }
  return true;
}

function buyerName(name: string, email: string) {
  const cleaned = name.replace(/\s+/g, " ").trim().slice(0, 80);
  if (cleaned) {
    return cleaned;
  }
  const local = email.split("@")[0]?.replace(/[._-]+/g, " ").trim();
  return local || "Radar Global";
}
