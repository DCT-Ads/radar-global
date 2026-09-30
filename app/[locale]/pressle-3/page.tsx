import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { OfertaStandardEsLanding } from "@/components/hotmart/oferta-standard-es-landing";

export const metadata: Metadata = {
  title: "Radar Global — Standard 45,50 € / mes",
  description:
    "SaaS de monitoreo de lanzamientos. Standard 45,50 € / mes. Anual 455,00 €. Sin promesa de ingresos.",
  openGraph: {
    title: "Radar Global — Standard",
    description: "Standard mensual 45,50 €. Order bump anual 455,00 € por 12 meses.",
    images: ["/brand/capa-produto-es.png"],
  },
};

export default async function Pressle3Page() {
  setRequestLocale("es");
  return <OfertaStandardEsLanding variant="pressle" />;
}
