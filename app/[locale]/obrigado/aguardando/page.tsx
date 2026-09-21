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
  return { title: t("pendingTitle"), description: t("pendingBody") };
}

export default async function ObrigadoAguardandoPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(assertLocale(locale));
  const t = await getTranslations("obrigado");
  const home = await getTranslations("home");
  return (
    <ThankYouScreen
      variant="pending"
      kicker={t("pendingKicker")}
      title={t("pendingTitle")}
      body={t("pendingBody")}
      imageSrc="/brand/banner-laptop.png"
      imageAlt={home("laptopAlt")}
      ctaSignup={t("ctaSignup")}
      ctaLogin={t("ctaLogin")}
      footer={t("footer")}
    />
  );
}
