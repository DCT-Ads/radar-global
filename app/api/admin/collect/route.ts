import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";
import { enqueueOrRunCollection } from "@/lib/queue/collect";
import { enqueueOrRunReprobe } from "@/lib/queue/reprobe";

export const maxDuration = 60;

export async function POST(request: Request) {
  const { user, response } = await requireAdmin();
  if (!user || response) {
    return response;
  }

  try {
    const [outcome] = await Promise.all([
      enqueueOrRunCollection(),
      enqueueOrRunReprobe("inline"),
    ]);
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "COLLECT_RUN",
        entity: "Source",
        entityId: "crtsh",
        metadata: { mode: outcome.mode },
        ip: request.headers.get("x-forwarded-for"),
      },
    });
    return NextResponse.json(outcome);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Collection failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
