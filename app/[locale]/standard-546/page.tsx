import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { OfertaStandardEsLanding } from "@/components/hotmart/oferta-standard-es-landing";

export const metadata: Metadata = {
  title: "Radar Global — Standard anual 546,00 €",
  description:
    "SaaS de monitoreo de lanzamientos. Standard anual 546,00 € por 12 meses. Sin promesa de ingresos.",
  openGraph: {
    title: "Radar Global — Standard anual 546,00 €",
    description: "Pagas 546,00 € y usas 12 meses. Doce meses al mes serían 655,20 €.",
    images: ["/brand/capa-produto-es.png"],
  },
};

export default async function Standard546Page() {
  setRequestLocale("es");
  return <OfertaStandardEsLanding variant="pressle" offer="546" bumpDefault />;
}
