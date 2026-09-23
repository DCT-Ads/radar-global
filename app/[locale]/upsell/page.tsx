import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { UpsellLanding } from "@/components/hotmart/upsell-landing";

export const metadata: Metadata = {
  title: "Radar Global — Upsell Premium Anual",
  description:
    "Sua assinatura mensal está feita. Suba para o anual: 10× R$ 79,99 ou 12× R$ 66,59.",
  openGraph: {
    title: "Radar Global — Upsell Premium Anual",
    description: "Pague 10 meses e use 12. Preço em Real.",
    images: ["/brand/capa-produto.png"],
  },
};

export default async function UpsellPage() {
  setRequestLocale("pt");
  return <UpsellLanding />;
}
