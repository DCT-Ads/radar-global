import { getTranslations, setRequestLocale } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { assertLocale } from "@/i18n/routing";
import { PLAN_PRICES } from "@/lib/auth/access";
import { getCurrentUser } from "@/lib/auth/session";

type UpgradePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function UpgradePage({ params }: UpgradePageProps) {
  const { locale } = await params;
  setRequestLocale(assertLocale(locale));
  const t = await getTranslations("upgrade");
  const user = await getCurrentUser();
  const current =
    user?.role === "ADMIN" || user?.plan === "PREMIUM" ? "PREMIUM" : "STANDARD";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-primary">{t("title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-[#1E3A5F] bg-[#12263F]/80 text-[#F5F7FA]">
          <CardHeader>
            <CardTitle className="text-[#D4AF37]">{t("standardName")}</CardTitle>
            <p className="text-2xl font-semibold">{PLAN_PRICES.STANDARD.monthly}</p>
            <p className="text-xs text-[#8BA3B8]">{t("perMonth")}</p>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-[#8BA3B8]">
            <p>✓ {t("standardRadar")}</p>
            <p>✓ {t("standardDashboard")}</p>
            <p>— {t("noUpcoming")}</p>
            <p>— {t("noCopy")}</p>
            <p>— {t("noAssistant")}</p>
            {current === "STANDARD" ? (
              <p className="pt-2 text-xs text-[#D4AF37]">{t("currentPlan")}</p>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-[#D4AF37] bg-[#12263F]/80 text-[#F5F7FA]">
          <CardHeader>
            <CardTitle className="text-[#D4AF37]">{t("premiumName")}</CardTitle>
            <p className="text-2xl font-semibold">{PLAN_PRICES.PREMIUM.monthly}</p>
            <p className="text-xs text-[#8BA3B8]">{t("perMonth")}</p>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-[#F5F7FA]">
            <p>✓ {t("premiumEverything")}</p>
            <p>✓ {t("premiumUpcoming")}</p>
            <p>✓ {t("premiumCopy")}</p>
            <p>✓ {t("premiumAssistant")}</p>
            {current === "PREMIUM" ? (
              <p className="pt-2 text-xs text-[#D4AF37]">{t("currentPlan")}</p>
            ) : (
              <p className="pt-3 text-sm text-[#8BA3B8]">{t("manualNote")}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Link href="/radar" className="text-sm text-[#00C2CB] hover:underline">
        ← {t("backToRadar")}
      </Link>
    </div>
  );
}
