import type { AccessPlan } from "@prisma/client";
import { PlanSlug } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";

const PLANS: AccessPlan[] = ["STANDARD", "PREMIUM"];

function subscriptionSlug(plan: AccessPlan) {
  return plan === "PREMIUM" ? PlanSlug.PREMIUM : PlanSlug.PRO;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { user, response } = await requireAdmin();
  if (!user || response) {
    return response;
  }

  const { id } = await context.params;
  const body: unknown = await request.json();
  const plan =
    body && typeof body === "object" && "plan" in body && typeof body.plan === "string"
      ? body.plan
      : null;

  if (!plan || !PLANS.includes(plan as AccessPlan)) {
    return NextResponse.json({ error: "INVALID_PLAN" }, { status: 400 });
  }

  const paidPlan = await prisma.plan.findUnique({
    where: { slug: subscriptionSlug(plan as AccessPlan) },
  });
  if (!paidPlan) {
    return NextResponse.json({ error: "PLAN_NOT_SEEDED" }, { status: 500 });
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      plan: plan as AccessPlan,
      subscription: {
        upsert: {
          create: { planId: paidPlan.id, status: "ACTIVE" },
          update: { planId: paidPlan.id, status: "ACTIVE" },
        },
      },
    },
    select: { id: true, email: true, plan: true },
  });

  return NextResponse.json({ user: updated });
}
