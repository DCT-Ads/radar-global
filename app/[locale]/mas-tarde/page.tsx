import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { FunilEspanolLanding } from "@/components/hotmart/funil-espanol-landing";

export const metadata: Metadata = {
  title: "Tal vez en otra oportunidad — Radar Global",
  description: "El anual queda para después. El Premium mensual sigue.",
  openGraph: { images: ["/brand/capa-produto-es.png"] },
};

export default async function MasTardePage() {
  setRequestLocale("es");
  return <FunilEspanolLanding variant="declined" />;
}
