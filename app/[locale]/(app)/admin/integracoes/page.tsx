import { getTranslations, setRequestLocale } from "next-intl/server";
import { AdminTabs } from "@/components/admin/admin-tabs";
import { IntegrationTab } from "@/components/admin/integration-tab";
import { assertLocale } from "@/i18n/routing";
import { getMuncheyeCardStats } from "@/lib/collectors/marketplace/run-muncheye";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminIntegracoesPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(assertLocale(locale));
  const t = await getTranslations("admin");
  const muncheyeStats = await getMuncheyeCardStats(locale);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      <AdminTabs active="integracoes" />
      <IntegrationTab muncheyeStats={muncheyeStats} />
    </div>
  );
}
