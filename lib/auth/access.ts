import type { AccessPlan, Role } from "@prisma/client";

export type AccessUser = {
  role: Role;
  plan: AccessPlan;
  subscription?: {
    status: string;
    plan: { slug: string };
  } | null;
};

export const PLAN_PRICES = {
  STANDARD: { amount: "54,60", monthly: "R$ 54,60" },
  PREMIUM: { amount: "79,90", monthly: "R$ 79,90" },
} as const;

/** Premium anual Brasil (order bump): 10× R$ 79,99 = R$ 799,99 ou 12× R$ 66,59. */
export const PREMIUM_ANNUAL_BRL = {
  currency: "BRL",
  tenX: "10× R$ 79,99",
  tenXTotal: "R$ 799,99",
  twelveX: "12× R$ 66,59",
  twelveXTotal: "R$ 799,08",
  cash: "R$ 799,00",
} as const;

/** Premium Europa: mensal é a oferta principal; anual entra como order bump. */
export const PREMIUM_EUR = {
  currency: "EUR",
  monthly: "€ 79,99",
  monthlyLabel: "€ 79,99 / mês",
} as const;

/** Standard Europa (campanha em espanhol): 45,50 € / mes, hasta cancelar. */
export const STANDARD_EUR = {
  currency: "EUR",
  monthly: "45,50 €",
  monthlyLabel: "45,50 € / mes",
  cashNote: "Mensual · al contado",
  untilCancel: "Hasta que el cliente cancele",
} as const;

/** Standard atualizado: 54,60 € / mes. 10 × 54,60 € = 546,00 €. 12 × 54,60 € = 655,20 €. */
export const STANDARD_EUR_5460 = {
  currency: "EUR",
  monthly: "54,60 €",
  monthlyLabel: "54,60 € / mes",
  cashNote: "Mensual · al contado",
  untilCancel: "Hasta que el cliente cancele",
} as const;

export const STANDARD_EUR_5460_ANNUAL = {
  currency: "EUR",
  total: "546,00 €",
  totalLabel: "546,00 € / año",
  was: "655,20 €",
  save: "109,20 €",
} as const;

/** Standard anual: 10 × 45,50 € = 455,00 € (12 meses). 12 × 45,50 € = 546,00 €. */
export const STANDARD_EUR_ANNUAL = {
  currency: "EUR",
  total: "455,00 €",
  totalLabel: "455,00 € / año",
  was: "546,00 €",
  save: "91,00 €",
} as const;

/** Premium mensal em espanhol: € 79,90 / mes, hasta cancelar. */
export const PREMIUM_EUR_79 = {
  currency: "EUR",
  monthly: "€ 79,90",
  monthlyLabel: "€ 79,90 / mes",
  cashNote: "Mensual · al contado",
  untilCancel: "Hasta que el cliente cancele",
} as const;

/** Anual do mesmo SaaS em espanhol: 10× € 79,90 = € 799,00 (2 meses gratis). */
export const PREMIUM_EUR_79_ANNUAL = {
  currency: "EUR",
  installment: "10× € 79,90",
  total: "€ 799,00",
  totalPlain: "799,00 €",
  monthlyPlain: "79,90 €",
  fullYear: "12× € 79,90",
  fullYearTotal: "€ 958,80",
  was: "958,80 €",
  save: "159,80 €",
} as const;

/** Premium promoción en español: € 227,50 / mes al contado, hasta cancelar. */
export const PREMIUM_EUR_PROMO = {
  currency: "EUR",
  monthly: "€ 227,50",
  monthlyLabel: "€ 227,50 / mes",
  cashNote: "Mensual · al contado",
  untilCancel: "Hasta que el cliente cancele",
} as const;

export const PREMIUM_ANNUAL_EUR = {
  currency: "EUR",
  currencyLabel: "Euro",
  monthly: "€ 79,99",
  monthsCharged: 10,
  monthsFree: 2,
  installment: "10× € 79,99",
  total: "€ 799,99",
  fullYear: "12× € 79,99",
  fullYearTotal: "€ 959,88",
} as const;

export function hasPaidAccess(user: AccessUser | null | undefined) {
  if (!user) {
    return false;
  }
  if (user.role === "ADMIN") {
    return true;
  }
  const slug = user.subscription?.plan.slug;
  return user.subscription?.status === "ACTIVE" && Boolean(slug) && slug !== "FREE";
}

export function hasPremiumAccess(user: AccessUser | null | undefined) {
  return Boolean(user && (user.role === "ADMIN" || user.plan === "PREMIUM"));
}

export function canSeeUpcomingLaunches(user: AccessUser | null | undefined) {
  return hasPremiumAccess(user);
}

export function canUseCopy(user: AccessUser | null | undefined) {
  return hasPremiumAccess(user);
}

export function canUseAssistant(user: AccessUser | null | undefined) {
  return hasPremiumAccess(user);
}
