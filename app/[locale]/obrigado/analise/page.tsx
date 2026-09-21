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
  return { title: t("creditTitle"), description: t("creditBody") };
}

export default async function ObrigadoAnalisePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(assertLocale(locale));
  const t = await getTranslations("obrigado");
  const home = await getTranslations("home");
  return (
    <ThankYouScreen
      variant="credit"
      kicker={t("creditKicker")}
      title={t("creditTitle")}
      body={t("creditBody")}
      imageSrc="/brand/tela-radar.png"
      imageAlt={home("uiAlt")}
      ctaSignup={t("ctaSignup")}
      ctaLogin={t("ctaLogin")}
      footer={t("footer")}
    />
  );
}
