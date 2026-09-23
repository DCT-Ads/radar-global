import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { OutraOportunidadeLanding } from "@/components/hotmart/outra-oportunidade-landing";

export const metadata: Metadata = {
  title: "Tudo bem — Radar Global",
  description: "Quem sabe em uma outra oportunidade. Fique ligado nas redes sociais.",
};

export default async function OutraOportunidadePage() {
  setRequestLocale("pt");
  return <OutraOportunidadeLanding />;
}
