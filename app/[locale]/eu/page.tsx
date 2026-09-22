import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { OfertaEuroLanding } from "@/components/hotmart/oferta-euro-landing";
import { assertLocale } from "@/i18n/routing";

type EuroPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: EuroPageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(assertLocale(locale));
  const t = await getTranslations("ofertaEuro");
  return {
    title: t("monthlyName"),
    description: t("subtitle"),
    openGraph: {
      title: t("monthlyName"),
      description: t("subtitle"),
      images: ["/brand/capa-produto.png"],
    },
  };
}

export default async function EuroOfferPage({ params }: EuroPageProps) {
  const { locale } = await params;
  setRequestLocale(assertLocale(locale));
  return <OfertaEuroLanding />;
}
