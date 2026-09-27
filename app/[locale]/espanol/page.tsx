import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { OfertaEspanolLanding } from "@/components/hotmart/oferta-espanol-landing";

export const metadata: Metadata = {
  title: "Radar Global — Premium",
  description:
    "Software de monitoreo de señales públicas de lanzamientos. Suscripción Premium € 227,50 / mes. Sin promesa de ingresos.",
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
