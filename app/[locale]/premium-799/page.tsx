import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { OfertaEspanolLanding } from "@/components/hotmart/oferta-espanol-landing";

export const metadata: Metadata = {
  title: "Radar Global — Premium anual € 799,00",
  description:
    "SaaS de monitoreo de lanzamientos. Premium anual € 799,00 por 12 meses. Sin promesa de ingresos.",
  openGraph: {
    title: "Radar Global — Premium anual € 799,00",
    description: "10× € 79,90 (€ 799,00) y 12 meses de uso. No es 12× € 79,90.",
    images: ["/brand/capa-produto-es.png"],
  },
};

export default async function Premium799Page() {
  setRequestLocale("es");
  return <OfertaEspanolLanding variant="pressle79" bumpDefault footerKey="footer799" />;
}
