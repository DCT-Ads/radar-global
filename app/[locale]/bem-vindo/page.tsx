import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { BemVindoLanding } from "@/components/hotmart/bem-vindo-landing";

export const metadata: Metadata = {
  title: "Obrigada — seja bem-vindo ao Radar Global",
  description: "Sua compra foi confirmada. Seja bem-vindo ao Radar Global.",
};

export default async function BemVindoPage() {
  setRequestLocale("pt");
  return <BemVindoLanding />;
}
