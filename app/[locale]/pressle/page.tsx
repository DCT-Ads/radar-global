import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { OfertaEspanolLanding } from "@/components/hotmart/oferta-espanol-landing";

export const metadata: Metadata = {
  title: "Radar Global — SaaS Premium",
  description:
    "SaaS de monitoreo de lanzamientos. Suscripción Premium € 79,90 / mes. Sin promesa de ingresos.",
  openGraph: {
    title: "Radar Global — SaaS Premium",
    description: "SaaS de monitoreo. € 79,90 / mes. Sin promesa de ingresos.",
    images: ["/brand/capa-produto-es.png"],
  },
};

export default async function PressleEsPage() {
  setRequestLocale("es");
  return <OfertaEspanolLanding variant="pressle79" />;
}
