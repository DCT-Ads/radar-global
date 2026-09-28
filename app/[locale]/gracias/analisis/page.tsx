import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { FunilEspanolLanding } from "@/components/hotmart/funil-espanol-landing";

export const metadata: Metadata = {
  title: "Análisis de crédito — Radar Global",
  description: "Tu tarjeta está en análisis. Usa el mismo correo de la compra.",
  openGraph: { images: ["/brand/capa-produto-es.png"] },
};

export default async function GraciasAnalisisPage() {
  setRequestLocale("es");
  return <FunilEspanolLanding variant="credit" />;
}
