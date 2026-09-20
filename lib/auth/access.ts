import type { AccessPlan, Role } from "@prisma/client";

export type AccessUser = {
  role: Role;
  plan: AccessPlan;
};

export const PLAN_PRICES = {
  STANDARD: { amount: "54,60", monthly: "R$ 54,60" },
  PREMIUM: { amount: "79,90", monthly: "R$ 79,90" },
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
