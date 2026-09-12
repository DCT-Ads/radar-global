import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { isPlatformId, PLATFORMS, type PlatformField } from "@/lib/integrations/platforms";
import {
  getDecryptedCreds,
  mergeCreds,
  missingRequiredFields,
  saveIntegration,
  type IntegrationCreds,
} from "@/lib/integrations/store";
import { validatePlatform } from "@/lib/integrations/validators";
import { prisma } from "@/lib/prisma";

type RouteProps = {
  params: Promise<{ platform: string }>;
};

function readCreds(body: unknown): IntegrationCreds {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return {};
  }
  const record = body as Record<string, unknown>;
  const source =
    record.creds && typeof record.creds === "object" && !Array.isArray(record.creds)
      ? (record.creds as Record<string, unknown>)
      : record;
  const creds: IntegrationCreds = {};
  for (const field of Object.keys(source) as PlatformField[]) {
    const value = source[field];
    if (typeof value === "string") {
      creds[field] = value;
    }
  }
  return creds;
}

export async function POST(request: Request, { params }: RouteProps) {
  const { user, response } = await requireAdmin();
  if (!user || response) {
    return response;
  }
  const { platform } = await params;
  if (!isPlatformId(platform)) {
    return NextResponse.json({ error: "UNKNOWN_PLATFORM" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const submitted = readCreds(body);
  const stored = await getDecryptedCreds(platform);
  const creds = mergeCreds(stored, submitted);
  const nickname =
    body && typeof body === "object" && typeof (body as { nickname?: unknown }).nickname === "string"
      ? (body as { nickname: string }).nickname
      : undefined;

  if (missingRequiredFields(platform, creds).length > 0) {
    return NextResponse.json(
      { ok: false, error: "KEY_REQUIRED" },
      { status: 400 },
    );
  }

  const result = await validatePlatform(platform, creds);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error ?? "INVALID" },
      { status: 401 },
    );
  }

  const liveUnavailable = result.error === "LIVE_UNAVAILABLE";
  const saved = await saveIntegration({
    platform,
    creds,
    nickname,
    validated: !liveUnavailable,
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "INTEGRATION_VALIDATE",
      entity: "Integration",
      entityId: platform,
      metadata: {
        nickname: saved.nickname,
        fields: PLATFORMS[platform].fields,
      },
      ip: request.headers.get("x-forwarded-for"),
    },
  });

  return NextResponse.json(
    {
      ...saved,
      ok: true,
      status: liveUnavailable ? "saved" : "validated",
      error: liveUnavailable ? "LIVE_UNAVAILABLE" : undefined,
    },
    { status: 200 },
  );
}
