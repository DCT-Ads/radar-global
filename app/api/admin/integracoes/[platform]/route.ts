import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { isPlatformId, PLATFORMS, type PlatformField } from "@/lib/integrations/platforms";
import {
  getPublicIntegration,
  missingRequiredFields,
  saveIntegration,
  type IntegrationCreds,
} from "@/lib/integrations/store";
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

export async function GET(_request: Request, { params }: RouteProps) {
  const { user, response } = await requireAdmin();
  if (!user || response) {
    return response;
  }
  const { platform } = await params;
  if (!isPlatformId(platform)) {
    return NextResponse.json({ error: "UNKNOWN_PLATFORM" }, { status: 404 });
  }
  return NextResponse.json(await getPublicIntegration(platform));
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
  const creds = readCreds(body);
  const nickname =
    body && typeof body === "object" && typeof (body as { nickname?: unknown }).nickname === "string"
      ? (body as { nickname: string }).nickname
      : undefined;

  const current = await getPublicIntegration(platform);
  const submittedRequired = missingRequiredFields(platform, creds);
  const missingStored = submittedRequired.filter((field) => !current.has[field]);
  if (missingStored.length > 0) {
    return NextResponse.json({ error: "KEY_REQUIRED" }, { status: 400 });
  }

  const saved = await saveIntegration({
    platform,
    creds,
    nickname,
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "INTEGRATION_SAVE",
      entity: "Integration",
      entityId: platform,
      metadata: {
        nickname: saved.nickname,
        fields: PLATFORMS[platform].fields,
        has: saved.has,
      },
      ip: request.headers.get("x-forwarded-for"),
    },
  });

  return NextResponse.json(saved);
}
