"use client";

import type { Role } from "@prisma/client";
import { Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type AppNavProps = {
  role: Role;
  premiumLocked: boolean;
  className?: string;
};

export function AppNav({ role, premiumLocked, className }: AppNavProps) {
  const t = useTranslations("nav");

  const items = [
    { href: "/dashboard", label: t("dashboard"), locked: false },
    { href: "/radar", label: t("radar"), locked: false },
    { href: premiumLocked ? "/upgrade" : "/copy", label: t("copy"), locked: premiumLocked },
    { href: premiumLocked ? "/upgrade" : "/chat", label: t("chat"), locked: premiumLocked },
  ] as const;

  return (
    <nav className={cn("flex flex-col gap-1 text-sm", className)}>
      {items.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className="flex items-center justify-between rounded-md px-3 py-2 text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
        >
          <span>{item.label}</span>
          {item.locked ? (
            <Lock className="h-3.5 w-3.5 text-[#D4AF37]" aria-label={t("locked")} />
          ) : null}
        </Link>
      ))}
      {role === "ADMIN" ? (
        <Link
          href="/admin"
          className="rounded-md px-3 py-2 text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
        >
          {t("admin")}
        </Link>
      ) : null}
    </nav>
  );
}
