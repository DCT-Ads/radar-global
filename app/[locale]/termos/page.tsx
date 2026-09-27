import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LegalScreen } from "@/components/hotmart/legal-screen";
import { assertLocale } from "@/i18n/routing";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legal");
  return { title: `Radar Global — ${t("terms")}`, description: t("termsLead") };
}

export default async function TermosPage({ params }: PageProps) {
  setRequestLocale(assertLocale((await params).locale));
  const t = await getTranslations("legal");
  return (
    <LegalScreen title={t("terms")}>
      <p>{t("termsLead")}</p>
      <p>{t("termsBody1")}</p>
      <p>{t("termsBody2")}</p>
      <p>{t("termsBody3")}</p>
    </LegalScreen>
  );
}
