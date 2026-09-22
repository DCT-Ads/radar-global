import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { OfertaAnualLanding } from "@/components/hotmart/oferta-anual-landing";

export const metadata: Metadata = {
  title: "Radar Global — Premium Anual",
  description:
    "Order bump anual em Real: 10× R$ 79,99 = R$ 799,99 ou 12× R$ 66,59. Idioma e moeda travados.",
  openGraph: {
    title: "Radar Global — Premium Anual",
    description: "Pague 10 meses e use 12, ou 12× R$ 66,59. Preço em Real.",
    images: ["/brand/capa-produto.png"],
  },
};

export default async function AnualPage() {
  setRequestLocale("pt");
  return <OfertaAnualLanding />;
}
