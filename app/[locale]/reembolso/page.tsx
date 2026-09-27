import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LegalScreen } from "@/components/hotmart/legal-screen";
import { assertLocale } from "@/i18n/routing";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legal");
  return { title: `Radar Global — ${t("refund")}`, description: t("refundLead") };
}

export default async function ReembolsoPage({ params }: PageProps) {
  setRequestLocale(assertLocale((await params).locale));
  const t = await getTranslations("legal");
  return (
    <LegalScreen title={t("refund")}>
      <p>{t("refundLead")}</p>
      <p>{t("refundBody1")}</p>
      <p>{t("refundBody2")}</p>
    </LegalScreen>
  );
}
