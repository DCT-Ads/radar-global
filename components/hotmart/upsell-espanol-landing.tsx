import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PREMIUM_EUR_79_ANNUAL } from "@/lib/auth/access";
import { hotmartCheckoutUrls } from "@/lib/hotmart-checkout";
import { SalesLegalFooter } from "@/components/hotmart/sales-legal-footer";

export async function UpsellEspanolLanding() {
  const t = await getTranslations("funilEspanol");
  const home = await getTranslations("home");
  const annualHref = hotmartCheckoutUrls().premiumEsAnnual;
  const ctaClass =
    "inline-flex h-11 w-full max-w-md items-center justify-center rounded-md bg-[#D4AF37] px-6 text-sm font-semibold text-[#0B1C33] hover:bg-[#D4AF37]/90";

  return (
    <main className="relative min-h-screen bg-[#0B1C33] text-[#F5F7FA]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.16),transparent_55%)]" />
      <header className="relative z-10 mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
        <Link href="/planes" className="text-sm font-semibold tracking-wide text-[#D4AF37]">
          Radar Global
        </Link>
        <p className="rounded-full border border-[#D4AF37] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#D4AF37]">
          {t("lock")}
        </p>
      </header>
      <section className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-6 pb-16 pt-4 text-center">
        <Image
          src="/brand/capa-produto-es.png"
          alt={home("coverAlt")}
          width={420}
          height={420}
          priority
          className="h-auto w-full max-w-[220px]"
        />
        <p className="mt-4 text-xs font-medium uppercase tracking-[0.22em] text-[#D4AF37]">
          {t("upsellKicker")}
        </p>
        <h1 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("upsellHeadline")}
        </h1>
        <p className="mt-4 max-w-xl text-base text-[#8BA3B8]">{t("upsellBody")}</p>
        <p className="mt-6 text-3xl font-semibold">{PREMIUM_EUR_79_ANNUAL.installment}</p>
        <p className="mt-1 text-sm text-[#D4AF37]">Total {PREMIUM_EUR_79_ANNUAL.total} · Euro</p>
        <div className="mt-8 flex w-full flex-col items-center gap-3">
          <a href={annualHref} className={ctaClass}>
            {t("ctaAnnual")}
          </a>
          <Link
            href="/mas-tarde"
            className="inline-flex h-11 w-full max-w-md items-center justify-center rounded-md border border-[#D4AF37] bg-transparent px-6 text-sm font-semibold text-[#D4AF37] hover:bg-[#D4AF37]/10"
          >
            {t("ctaNo")}
          </Link>
        </div>
        <p className="mt-10 text-xs text-[#8BA3B8]">{t("footerUpsell")}</p>
        <SalesLegalFooter />
      </section>
    </main>
  );
}
