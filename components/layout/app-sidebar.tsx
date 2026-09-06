import type { Role } from "@prisma/client";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

type AppSidebarProps = {
  role: Role;
};

export async function AppSidebar({ role }: AppSidebarProps) {
  const t = await getTranslations("nav");

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-card/40 md:flex md:flex-col">
      <div className="border-b border-border px-6 py-5">
        <Link href="/dashboard" className="text-lg font-semibold tracking-tight text-primary">
          Radar Global
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-4 text-sm">
        <Link
          href="/dashboard"
          className="rounded-md px-3 py-2 text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
        >
          {t("dashboard")}
        </Link>
        <Link
          href="/radar"
          className="rounded-md px-3 py-2 text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
        >
          {t("radar")}
        </Link>
        {role === "ADMIN" ? (
          <Link
            href="/admin"
            className="rounded-md px-3 py-2 text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
          >
            {t("admin")}
          </Link>
        ) : null}
      </nav>
    </aside>
  );
}
