import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { FunilEspanolLanding } from "@/components/hotmart/funil-espanol-landing";

export const metadata: Metadata = {
  title: "Gracias — Bienvenido a Radar Global",
  description: "Tu compra fue confirmada. Crea tu cuenta con el mismo correo.",
  openGraph: { images: ["/brand/capa-produto-es.png"] },
};

export default async function GraciasPage() {
  setRequestLocale("es");
  return <FunilEspanolLanding variant="welcome" />;
}
