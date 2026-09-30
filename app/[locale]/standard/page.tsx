import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { OfertaStandardEsLanding } from "@/components/hotmart/oferta-standard-es-landing";

export const metadata: Metadata = {
  title: "Radar Global — Standard 45,50 € / mes",
  description:
    "SaaS de monitoreo de lanzamientos. Standard 45,50 € / mes o 455,00 € / año. Sin promesa de ingresos.",
  openGraph: {
    title: "Radar Global — Standard",
    description: "Standard mensual 45,50 €. Standard anual 455,00 €. Hasta que canceles el mensual.",
    images: ["/brand/capa-produto-es.png"],
  },
};

export default async function StandardEsPage() {
  setRequestLocale("es");
  return <OfertaStandardEsLanding />;
}
