"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const t = useTranslations("nav");
  const router = useRouter();

  async function onLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <Button type="button" variant="ghost" size="sm" onClick={onLogout}>
      {t("logout")}
    </Button>
  );
}
