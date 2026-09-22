import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { OfertaLanding } from "@/components/hotmart/oferta-landing";

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale("pt");
  const t = await getTranslations("oferta");
  return {
    title: `Radar Global — ${t("plansTitle")}`,
    description: t("subtitle"),
    openGraph: {
      title: `Radar Global — ${t("plansTitle")}`,
      description: t("subtitle"),
      images: ["/brand/capa-produto.png"],
    },
  };
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale("pt");
  return <OfertaLanding />;
}
