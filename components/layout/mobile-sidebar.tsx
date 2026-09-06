"use client";

import type { Role } from "@prisma/client";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

type MobileSidebarProps = {
  role: Role;
};

export function MobileSidebar({ role }: MobileSidebarProps) {
  const t = useTranslations("nav");

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="md:hidden">
          Menu
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64">
        <SheetHeader>
          <SheetTitle className="text-primary">Radar Global</SheetTitle>
        </SheetHeader>
        <nav className="mt-6 flex flex-col gap-2 text-sm">
          <Link href="/dashboard" className="rounded-md px-3 py-2 hover:bg-muted">
            {t("dashboard")}
          </Link>
          <Link href="/radar" className="rounded-md px-3 py-2 hover:bg-muted">
            {t("radar")}
          </Link>
          {role === "ADMIN" ? (
            <Link href="/admin" className="rounded-md px-3 py-2 hover:bg-muted">
              {t("admin")}
            </Link>
          ) : null}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
