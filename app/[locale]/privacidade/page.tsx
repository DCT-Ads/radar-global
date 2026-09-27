import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LegalScreen } from "@/components/hotmart/legal-screen";
import { assertLocale } from "@/i18n/routing";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legal");
  return { title: `Radar Global — ${t("privacy")}`, description: t("privacyLead") };
}

export default async function PrivacidadePage({ params }: PageProps) {
  setRequestLocale(assertLocale((await params).locale));
  const t = await getTranslations("legal");
  return (
    <LegalScreen title={t("privacy")}>
      <p>{t("privacyLead")}</p>
      <p>{t("privacyBody1")}</p>
      <p>{t("privacyBody2")}</p>
      <p>{t("privacyBody3")}</p>
    </LegalScreen>
  );
}
