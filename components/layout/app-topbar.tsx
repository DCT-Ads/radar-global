import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { LogoutButton } from "@/components/layout/logout-button";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";

type AppTopbarProps = {
  user: {
    name: string;
    email: string;
    role: "USER" | "ADMIN";
    plan: "STANDARD" | "PREMIUM";
  };
};

export async function AppTopbar({ user }: AppTopbarProps) {
  const t = await getTranslations("nav");

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card/30 px-4 md:px-6">
      <div className="flex items-center gap-3">
        <MobileSidebar role={user.role} plan={user.plan} />
        <p className="hidden text-sm text-muted-foreground sm:block">{t("dashboard")}</p>
      </div>
      <div className="flex items-center gap-3">
        <LocaleSwitcher />
        <div className="hidden items-center gap-2 sm:flex">
          <div className="text-right">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">{user.email}</p>
          </div>
          <Badge variant="outline" className="border-primary/40 text-primary">
            {user.role === "ADMIN" ? user.role : t(user.plan === "PREMIUM" ? "planPremium" : "planStandard")}
          </Badge>
        </div>
        <LogoutButton />
      </div>
    </header>
  );
}
