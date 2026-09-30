import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { OfertaStandardEsLanding } from "@/components/hotmart/oferta-standard-es-landing";

export const metadata: Metadata = {
  title: "Radar Global — Standard 54,60 € / mes · Premium 79,90 € / mes",
  description:
    "SaaS de monitoreo en español. Standard 54,60 € / mes o Premium 79,90 € / mes. Sin promesa de ingresos.",
  openGraph: {
    title: "Radar Global",
    description: "Standard mensual 54,60 €. Premium mensual 79,90 €.",
    images: ["/brand/capa-produto-es.png"],
  },
};

export default async function PlanesPage() {
  setRequestLocale("es");
  return <OfertaStandardEsLanding variant="planes" />;
}
