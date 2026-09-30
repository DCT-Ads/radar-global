import { NextResponse } from "next/server";
import { hasPremiumAccess } from "@/lib/auth/access";
import { requireUser } from "@/lib/auth/require-user";
import { normalizeChannel } from "@/lib/alerts/deliver";
import { prisma } from "@/lib/prisma";

const TIMEZONES = ["America/Sao_Paulo", "America/New_York", "Europe/Madrid", "Europe/London"];

function phoneOf(value: unknown) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim().slice(0, 20);
  if (!trimmed) return "";
  return /^\+?[0-9]{8,16}$/.test(trimmed) ? trimmed : "";
}

export async function GET() {
  const { user, response } = await requireUser();
  if (!user || response) return response;
  const pref = await prisma.alertPreference.findUnique({ where: { userId: user.id } });
  return NextResponse.json({
    premium: hasPremiumAccess(user),
    stageAlerts: pref?.stageAlerts ?? true,
    digestEnabled: pref?.digestEnabled ?? true,
    digestHour: pref?.digestHour ?? 8,
    timezone: pref?.timezone ?? "America/Sao_Paulo",
    channel: normalizeChannel(pref?.channel),
    sensitivity: pref?.sensitivity === "HOT_ONLY" ? "HOT_ONLY" : "ALL",
    whatsappPhone: pref?.whatsappPhone ?? "",
    whatsappOptIn: pref?.whatsappOptIn ?? false,
  });
}

export async function PATCH(req: Request) {
  const { user, response } = await requireUser();
  if (!user || response) return response;
  const body: unknown = await req.json().catch(() => null);
  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const premium = hasPremiumAccess(user);
  const current = await prisma.alertPreference.findUnique({ where: { userId: user.id } });
  const stageAlerts = typeof record.stageAlerts === "boolean" ? record.stageAlerts : (current?.stageAlerts ?? true);
  let channel = normalizeChannel(typeof record.channel === "string" ? record.channel : current?.channel);
  if (!premium && channel !== "NONE") channel = "EMAIL";
  const hour = typeof record.digestHour === "number" ? Math.min(23, Math.max(0, Math.floor(record.digestHour))) : (current?.digestHour ?? 8);
  const timezone = typeof record.timezone === "string" && TIMEZONES.includes(record.timezone) ? record.timezone : (current?.timezone ?? "America/Sao_Paulo");
  const sensitivity = record.sensitivity === "HOT_ONLY" ? "HOT_ONLY" : "ALL";
  const phone = phoneOf(record.whatsappPhone);

  const pref = await prisma.alertPreference.upsert({
    where: { userId: user.id },
    update: {
      stageAlerts,
      channel,
      ...(premium
        ? {
            digestEnabled: typeof record.digestEnabled === "boolean" ? record.digestEnabled : (current?.digestEnabled ?? true),
            digestHour: hour,
            timezone,
            sensitivity,
            whatsappPhone: phone || null,
            whatsappOptIn: record.whatsappOptIn === true && Boolean(phone),
          }
        : {}),
    },
    create: {
      userId: user.id,
      stageAlerts,
      channel,
      digestEnabled: premium && record.digestEnabled !== false,
      digestHour: premium ? hour : 8,
      timezone: premium ? timezone : "America/Sao_Paulo",
      sensitivity: premium ? sensitivity : "ALL",
      whatsappPhone: premium ? phone || null : null,
      whatsappOptIn: premium && record.whatsappOptIn === true && Boolean(phone),
    },
  });

  return NextResponse.json({
    premium,
    stageAlerts: pref.stageAlerts,
    digestEnabled: pref.digestEnabled,
    digestHour: pref.digestHour,
    timezone: pref.timezone,
    channel: normalizeChannel(pref.channel),
    sensitivity: pref.sensitivity === "HOT_ONLY" ? "HOT_ONLY" : "ALL",
    whatsappPhone: pref.whatsappPhone ?? "",
    whatsappOptIn: pref.whatsappOptIn,
  });
}
