"use client";

import type { AccessPlan, Role } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { hasPremiumAccess } from "@/lib/auth/access";
import { AppNav } from "@/components/layout/app-nav";

type MobileSidebarProps = {
  role: Role;
  plan: AccessPlan;
};

export function MobileSidebar({ role, plan }: MobileSidebarProps) {
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
        <AppNav
          role={role}
          premiumLocked={!hasPremiumAccess({ role, plan })}
          className="mt-6 gap-2"
        />
      </SheetContent>
    </Sheet>
  );
}
