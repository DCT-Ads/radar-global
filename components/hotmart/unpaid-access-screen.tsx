import { getLocale, getTranslations } from "next-intl/server";
import { PLAN_PRICES, PREMIUM_EUR_79 } from "@/lib/auth/access";
import { hotmartCheckoutUrls } from "@/lib/hotmart-checkout";

export async function UnpaidAccessScreen() {
  const locale = await getLocale();
  const checkout = hotmartCheckoutUrls();
  const spanish = locale === "es";
  const t = await getTranslations(spanish ? "funilEspanol" : "unpaid");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0B1C33] px-6 text-center text-[#F5F7FA]">
      <p className="text-sm font-semibold tracking-wide text-[#D4AF37]">Radar Global</p>
      <h1 className="mt-4 max-w-lg text-3xl font-semibold">
        {spanish ? t("unpaidTitle") : t("title")}
      </h1>
      <p className="mt-3 max-w-md text-sm text-[#8BA3B8]">
        {spanish ? t("unpaidBody") : t("body")}
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {spanish ? (
          <a
            href={checkout.premiumEs79}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-11 items-center justify-center rounded-md bg-[#D4AF37] px-6 text-sm font-semibold text-[#0B1C33] hover:bg-[#D4AF37]/90"
          >
            {t("ctaPremium")} · {PREMIUM_EUR_79.monthlyLabel}
          </a>
        ) : (
          <>
            <a
              href={checkout.standard}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center justify-center rounded-md border border-[#D4AF37] px-6 text-sm font-semibold text-[#D4AF37] hover:bg-[#D4AF37]/10"
            >
              {t("ctaStandard")} · {PLAN_PRICES.STANDARD.monthly}
            </a>
            <a
              href={checkout.premium}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center justify-center rounded-md bg-[#D4AF37] px-6 text-sm font-semibold text-[#0B1C33] hover:bg-[#D4AF37]/90"
            >
              {t("ctaPremium")} · {PLAN_PRICES.PREMIUM.monthly}
            </a>
          </>
        )}
      </div>
    </main>
  );
}
