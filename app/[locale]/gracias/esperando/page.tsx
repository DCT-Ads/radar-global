import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { FunilEspanolLanding } from "@/components/hotmart/funil-espanol-landing";

export const metadata: Metadata = {
  title: "Esperando el pago — Radar Global",
  description: "Recibimos el pedido. El acceso se libera cuando Hotmart confirma el cobro.",
  openGraph: { images: ["/brand/capa-produto-es.png"] },
};

export default async function GraciasEsperandoPage() {
  setRequestLocale("es");
  return <FunilEspanolLanding variant="pending" />;
}
