import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { OfertaEspanolLanding } from "@/components/hotmart/oferta-espanol-landing";

export const metadata: Metadata = {
  title: "Radar Global — Premium € 79,90 / mes",
  description:
    "SaaS de monitoreo de lanzamientos. Premium € 79,90 / mes. Order bump anual € 799,00. Sin promesa de ingresos.",
  openGraph: {
    title: "Radar Global — Premium € 79,90 / mes",
    description: "Premium mensual € 79,90. Order bump anual 10× € 79,90 (€ 799,00).",
    images: ["/brand/capa-produto-es.png"],
  },
};

export default async function Premium7990Page() {
  setRequestLocale("es");
  return <OfertaEspanolLanding variant="pressle79" footerKey="footer7990" />;
}
