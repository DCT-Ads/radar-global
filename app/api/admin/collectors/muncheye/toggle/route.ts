import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  getMuncheyeCardStats,
  setMuncheyeAutoDaily,
} from "@/lib/collectors/marketplace/run-muncheye";
import { assertLocale } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  enabled: z.boolean(),
});

export async function POST(request: Request) {
  const { user, response } = await requireAdmin();
  if (!user || response) {
    return response;
  }

  const locale = assertLocale(new URL(request.url).searchParams.get("locale") ?? "pt");
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID" }, { status: 400 });
  }

  try {
    await setMuncheyeAutoDaily(parsed.data.enabled);
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "MUNCHEYE_AUTO_DAILY",
        entity: "Source",
        entityId: "muncheye",
        metadata: { enabled: parsed.data.enabled },
        ip: request.headers.get("x-forwarded-for"),
      },
    });
    const stats = await getMuncheyeCardStats(locale);
    return NextResponse.json(stats);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Toggle failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
