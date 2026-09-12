import { NextResponse } from "next/server";
import { redirect } from "@/i18n/navigation";
import { assertLocale } from "@/i18n/routing";
import { hasPremiumAccess } from "./access";
import { getCurrentUser } from "./session";
import { requireUser } from "./require-user";

export async function requirePremiumApi() {
  const { user, response } = await requireUser();
  if (!user || response) {
    return { user: null, response };
  }
  if (!hasPremiumAccess(user)) {
    return {
      user,
      response: NextResponse.json({ error: "UPGRADE_REQUIRED" }, { status: 403 }),
    };
  }
  return { user, response: null };
}

export async function requirePremiumPage(locale: string) {
  const safeLocale = assertLocale(locale);
  const user = await getCurrentUser();
  if (!user) {
    redirect({ href: "/login", locale: safeLocale });
  }
  if (!hasPremiumAccess(user)) {
    redirect({ href: "/upgrade", locale: safeLocale });
  }
  return user;
}
