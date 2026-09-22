import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { EuroOrderBump } from "@/components/hotmart/euro-order-bump";
import { hotmartCheckoutUrls } from "@/lib/hotmart-checkout";

export async function OfertaEuroLanding() {
  const t = await getTranslations("ofertaEuro");
  const home = await getTranslations("home");
  const checkout = hotmartCheckoutUrls();

  return (
    <main className="relative min-h-screen bg-[#0B1C33] text-[#F5F7FA]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.16),transparent_55%)]" />
      <header className="relative z-10 mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <p className="text-sm font-semibold tracking-wide text-[#D4AF37]">Radar Global</p>
        <p className="rounded-full border border-[#D4AF37] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#D4AF37]">
          {t("currencyLock")}
        </p>
      </header>

      <section className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-6 pb-12 pt-4 text-center">
        <Image
          src="/brand/capa-produto.png"
          alt={home("coverAlt")}
          width={640}
          height={640}
          priority
          className="h-auto w-full max-w-sm"
        />
        <p className="mt-2 text-xs font-medium uppercase tracking-[0.22em] text-[#D4AF37]">
          {t("kicker")}
        </p>
        <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">
          {t("headline")}
        </h1>
        <p className="mt-4 max-w-2xl text-base text-[#8BA3B8] sm:text-lg">{t("subtitle")}</p>
        <EuroOrderBump
          monthlyHref={checkout.premiumEuroMonthly || "/signup"}
          annualHref={checkout.premiumEuroAnnual || checkout.premiumEuroMonthly || "/signup"}
          copy={{
            monthlyName: t("monthlyName"),
            monthlyPrice: t("monthlyPrice"),
            monthlyNote: t("monthlyNote"),
            bumpTitle: t("bumpTitle"),
            bumpBody: t("bumpBody"),
            wasPrice: t("wasPrice"),
            equalsTotal: t("equalsTotal"),
            ctaMonthly: t("ctaMonthly"),
            ctaBump: t("ctaBump"),
          }}
        />
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-12">
        <Image
          src="/brand/banner-laptop.png"
          alt={home("laptopAlt")}
          width={1920}
          height={1080}
          className="h-auto w-full rounded-2xl border border-[#1E3A5F] shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
        />
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 px-6 pb-12 md:grid-cols-3">
        <div className="rounded-2xl border border-[#1E3A5F] bg-[#12263F]/80 p-5">
          <h2 className="text-lg font-semibold text-[#D4AF37]">{t("what1Title")}</h2>
          <p className="mt-2 text-sm text-[#8BA3B8]">{t("what1Body")}</p>
        </div>
        <div className="rounded-2xl border border-[#1E3A5F] bg-[#12263F]/80 p-5">
          <h2 className="text-lg font-semibold text-[#D4AF37]">{t("what2Title")}</h2>
          <p className="mt-2 text-sm text-[#8BA3B8]">{t("what2Body")}</p>
        </div>
        <div className="rounded-2xl border border-[#1E3A5F] bg-[#12263F]/80 p-5">
          <h2 className="text-lg font-semibold text-[#D4AF37]">{t("what3Title")}</h2>
          <p className="mt-2 text-sm text-[#8BA3B8]">{t("what3Body")}</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 px-6 pb-12 md:grid-cols-2">
        <Image
          src="/brand/tela-radar.png"
          alt={home("uiAlt")}
          width={1024}
          height={1024}
          className="h-auto w-full rounded-2xl border border-[#1E3A5F]"
        />
        <Image
          src="/brand/mockup-pc-celular.png"
          alt={home("devicesAlt")}
          width={1920}
          height={1080}
          className="h-auto w-full rounded-2xl border border-[#1E3A5F] object-cover"
        />
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-16 text-center">
        <h2 className="text-xl font-semibold text-[#D4AF37]">{t("guaranteeTitle")}</h2>
        <p className="mt-2 text-sm text-[#8BA3B8]">{t("guaranteeBody")}</p>
        <p className="mt-10 text-xs text-[#8BA3B8]">{t("footer")}</p>
      </section>
    </main>
  );
}
