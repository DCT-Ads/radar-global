import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type AdminTab = "review" | "collectors" | "integracoes" | "usuarios";

export async function AdminTabs({
  active,
  reviewHref = "/admin?tab=review",
}: {
  active: AdminTab;
  reviewHref?: string;
}) {
  const t = await getTranslations("admin");

  const tabs: Array<{ id: AdminTab; href: string; label: string }> = [
    { id: "review", href: reviewHref, label: t("tabReview") },
    { id: "collectors", href: "/admin?tab=collectors", label: t("tabCollectors") },
    { id: "integracoes", href: "/admin/integracoes", label: t("tabIntegrations") },
    { id: "usuarios", href: "/admin/usuarios", label: t("tabUsers") },
  ];

  return (
    <div className="flex gap-2 border-b border-border">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          className={cn(
            "border-b-2 px-3 py-2 text-sm",
            active === tab.id
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
