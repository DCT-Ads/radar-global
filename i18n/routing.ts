import { defineRouting } from "next-intl/routing";

export const LOCALES = ["en", "pt", "es"] as const;
export type Locale = (typeof LOCALES)[number];

export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: "pt",
  localePrefix: "as-needed",
});

export function assertLocale(value: string): Locale {
  return (LOCALES.includes(value as Locale) ? value : "pt") as Locale;
}
