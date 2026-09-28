import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { UpsellEspanolLanding } from "@/components/hotmart/upsell-espanol-landing";

export const metadata: Metadata = {
  title: "Radar Global — Order bump anual",
  description: "Paga 10× € 79,90 y usa 12 meses. Mismo SaaS. Sin promesa de ingresos.",
  openGraph: {
    title: "Radar Global — Premium anual",
    description: "Order bump: 10× € 79,90 (€ 799,00).",
    images: ["/brand/capa-produto-es.png"],
  },
};

export default async function UpsellEsPage() {
  setRequestLocale("es");
  return <UpsellEspanolLanding />;
}
