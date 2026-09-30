import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { OfertaStandardEsLanding } from "@/components/hotmart/oferta-standard-es-landing";

export const metadata: Metadata = {
  title: "Radar Global — Standard 54,60 € / mes",
  description:
    "SaaS de monitoreo de lanzamientos. Standard 54,60 € / mes. Order bump anual 546,00 €. Sin promesa de ingresos.",
  openGraph: {
    title: "Radar Global — Standard 54,60 € / mes",
    description: "Standard mensual 54,60 €. Order bump anual 546,00 € por 12 meses.",
    images: ["/brand/capa-produto-es.png"],
  },
};

export default async function Standard5460Page() {
  setRequestLocale("es");
  return <OfertaStandardEsLanding variant="pressle" offer="546" />;
}
