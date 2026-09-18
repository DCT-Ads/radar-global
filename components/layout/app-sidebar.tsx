import type { AccessPlan, Role } from "@prisma/client";
import { BrandLogo } from "@/components/brand/brand-logo";
import { AppNav } from "@/components/layout/app-nav";
import { hasPremiumAccess } from "@/lib/auth/access";

type AppSidebarProps = {
  role: Role;
  plan: AccessPlan;
};

export async function AppSidebar({ role, plan }: AppSidebarProps) {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-card/40 md:flex md:flex-col">
      <div className="border-b border-border px-6 py-5">
        <BrandLogo href="/dashboard" />
      </div>
      <AppNav
        role={role}
        premiumLocked={!hasPremiumAccess({ role, plan })}
        className="flex-1 p-4"
      />
    </aside>
  );
}
