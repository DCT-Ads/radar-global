import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { OfertaEspanolLanding } from "@/components/hotmart/oferta-espanol-landing";

export const metadata: Metadata = {
  title: "Radar Global — Premium € 79,90 / mes",
  description:
    "SaaS de monitoreo de lanzamientos. Suscripción Premium € 79,90 / mes. Sin promesa de ingresos.",
  openGraph: {
    title: "Radar Global — Premium € 79,90 / mes",
    description: "SaaS Premium: € 79,90 / mes al contado. Hasta que canceles.",
    images: ["/brand/capa-produto-es.png"],
  },
};

export default async function MensualEsPage() {
  setRequestLocale("es");
  return <OfertaEspanolLanding variant="mensual79" />;
}
