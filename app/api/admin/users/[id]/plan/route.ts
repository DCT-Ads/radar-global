import type { AccessPlan } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";

const PLANS: AccessPlan[] = ["STANDARD", "PREMIUM"];

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

  const updated = await prisma.user.update({
    where: { id },
    data: { plan: plan as AccessPlan },
    select: { id: true, email: true, plan: true },
  });

  return NextResponse.json({ user: updated });
}
