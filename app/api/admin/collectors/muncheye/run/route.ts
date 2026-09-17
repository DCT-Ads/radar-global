import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  getMuncheyeCardStats,
  runMuncheyeCollection,
} from "@/lib/collectors/marketplace/run-muncheye";
import { assertLocale } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";

export const maxDuration = 120;

export async function POST(request: Request) {
  const { user, response } = await requireAdmin();
  if (!user || response) {
    return response;
  }

  const locale = assertLocale(new URL(request.url).searchParams.get("locale") ?? "pt");

  try {
    const result = await runMuncheyeCollection();
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "COLLECT_RUN",
        entity: "Source",
        entityId: "muncheye",
        metadata: { created: result.created, collected: result.collected },
        ip: request.headers.get("x-forwarded-for"),
      },
    });
    const stats = await getMuncheyeCardStats(locale);
    return NextResponse.json({ ...stats, created: result.created });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Collection failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
