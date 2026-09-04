"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { Button } from "@/components/ui/button";

const LABELS: Record<Locale, string> = {
  en: "EN",
  pt: "PT",
  es: "ES",
};

export function LocaleSwitcher() {
  const t = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1" aria-label={t("language")}>
      {routing.locales.map((item) => (
        <Button
          key={item}
          type="button"
          size="sm"
          variant={item === locale ? "default" : "ghost"}
          onClick={() => router.replace(pathname, { locale: item })}
        >
          {LABELS[item]}
        </Button>
      ))}
    </div>
  );
}
