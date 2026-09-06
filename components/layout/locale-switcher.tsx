"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";

export function LocaleSwitcher() {
  const t = useTranslations("common");
  const current = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function switchTo(next: Locale) {
    if (next === current) return;
    router.replace(pathname, { locale: next });
    router.refresh();
  }

  return (
    <div
      className="flex gap-1 rounded-lg bg-black/20 p-1"
      aria-label={t("language")}
    >
      {routing.locales.map((loc) => (
        <button
          key={loc}
          type="button"
          onClick={() => switchTo(loc)}
          className={`rounded-md px-3 py-1 text-sm font-semibold transition ${
            current === loc
              ? "bg-[#E7B84B] text-black"
              : "text-gray-300 hover:text-white"
          }`}
        >
          {loc.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
