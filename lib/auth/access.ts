import type { AccessPlan, Role } from "@prisma/client";

export type AccessUser = {
  role: Role;
  plan: AccessPlan;
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
