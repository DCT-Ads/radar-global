import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";
import {
  getManualLaunch,
  listManualLaunches,
  upsertManualLaunch,
} from "@/lib/signals/persist-manual";

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

export async function GET(request: Request) {
  const { user, response } = await requireAdmin();
  if (!user || response) {
    return response;
  }
  const id = new URL(request.url).searchParams.get("id");
  if (id) {
    const row = await getManualLaunch(id);
    if (!row) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    return NextResponse.json(row);
  }
  return NextResponse.json({ rows: await listManualLaunches() });
}

export async function POST(request: Request) {
  const { user, response } = await requireAdmin();
  if (!user || response) {
    return response;
  }
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  try {
    const signal = await upsertManualLaunch({
      id: asString(body?.id) || undefined,
      platform: asString(body?.platform),
      productName: asString(body?.productName),
      vendor: asString(body?.vendor),
      url: asString(body?.url),
      domain: asString(body?.domain),
      keyword: asString(body?.keyword),
      niche: asString(body?.niche),
      launchDate: asString(body?.launchDate),
      notes: asString(body?.notes),
      publish: body?.publish !== false,
    });
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "MANUAL_LAUNCH_UPSERT",
        entity: "Signal",
        entityId: signal.id,
        metadata: { source: signal.source, domain: signal.domain, status: signal.status },
        ip: request.headers.get("x-forwarded-for"),
      },
    });
    return NextResponse.json({ ok: true, id: signal.id, status: signal.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "SAVE_FAILED";
    const status =
      message === "UNKNOWN_PLATFORM" || message === "FIELDS_REQUIRED" ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
