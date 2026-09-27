import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { OfertaEspanolLanding } from "@/components/hotmart/oferta-espanol-landing";

export const metadata: Metadata = {
  title: "Radar Global — Premium",
  description:
    "Software de monitoreo de señales públicas. Promoción Premium mensual: € 227,50 al contado, hasta cancelar. Idioma y moneda fijos: español y Euro.",
  openGraph: {
    title: "Radar Global — Premium",
    description: "Promoción Premium mensual: € 227,50 al contado. Hasta que canceles.",
    images: ["/brand/capa-produto-es.png"],
  },
};

export default async function EspanolOfferPage() {
  setRequestLocale("es");
  return <OfertaEspanolLanding />;
}
