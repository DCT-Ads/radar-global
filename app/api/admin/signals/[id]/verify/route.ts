import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";
import { verifySignal } from "@/lib/signals/review";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { user, response } = await requireAdmin();
  if (!user || response) {
    return response;
  }

  const { id } = await context.params;

  try {
    const signal = await verifySignal(id);
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "SIGNAL_VERIFY",
        entity: "Signal",
        entityId: signal.id,
        metadata: { status: signal.status, launchId: signal.launchId },
        ip: request.headers.get("x-forwarded-for"),
      },
    });
    return NextResponse.json({ signal });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Verify failed";
    const status = message === "Signal not found" ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
