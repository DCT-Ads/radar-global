import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ThankYouScreen } from "@/components/hotmart/thank-you-screen";
import { assertLocale } from "@/i18n/routing";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(assertLocale(locale));
  const t = await getTranslations("obrigado");
  return { title: t("approvedTitle"), description: t("approvedBody") };
}

export default async function ObrigadoPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(assertLocale(locale));
  const t = await getTranslations("obrigado");
  const home = await getTranslations("home");
  return (
    <ThankYouScreen
      variant="approved"
      kicker={t("approvedKicker")}
      title={t("approvedTitle")}
      body={t("approvedBody")}
      imageSrc="/brand/capa-produto.png"
      imageAlt={home("coverAlt")}
      ctaSignup={t("ctaSignup")}
      ctaLogin={t("ctaLogin")}
      footer={t("footer")}
    />
  );
}
