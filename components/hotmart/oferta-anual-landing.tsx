import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PREMIUM_ANNUAL_BRL } from "@/lib/auth/access";
import { hotmartCheckoutUrls } from "@/lib/hotmart-checkout";

export async function OfertaAnualLanding() {
  const t = await getTranslations("ofertaAnual");
  const home = await getTranslations("home");
  const checkout = hotmartCheckoutUrls().premiumBrAnnual;
  const href = checkout || "/";
  const external = href.startsWith("http");
  const ctaClass =
    "inline-flex h-11 items-center justify-center rounded-md bg-[#D4AF37] px-6 text-sm font-semibold text-[#0B1C33] hover:bg-[#D4AF37]/90";

  return (
    <main className="relative min-h-screen bg-[#0B1C33] text-[#F5F7FA]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.16),transparent_55%)]" />
      <header className="relative z-10 mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <p className="text-sm font-semibold tracking-wide text-[#D4AF37]">Radar Global</p>
        <p className="rounded-full border border-[#D4AF37] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#D4AF37]">
          {t("lock")}
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

        <div className="mt-8 grid w-full max-w-3xl gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-[#D4AF37] bg-[#12263F]/90 p-6 text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37]">
              {t("badgeTen")}
            </p>
            <p className="mt-3 text-3xl font-semibold">{PREMIUM_ANNUAL_BRL.tenX}</p>
            <p className="mt-1 text-lg text-[#D4AF37]">{t("equalsTen")}</p>
            <p className="mt-3 text-sm text-[#8BA3B8]">{t("tenNote")}</p>
          </div>
          <div className="rounded-2xl border border-[#1E3A5F] bg-[#12263F]/90 p-6 text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37]">
              {t("badgeTwelve")}
            </p>
            <p className="mt-3 text-3xl font-semibold">{PREMIUM_ANNUAL_BRL.twelveX}</p>
            <p className="mt-1 text-lg text-[#D4AF37]">{t("equalsTwelve")}</p>
            <p className="mt-3 text-sm text-[#8BA3B8]">{t("twelveNote")}</p>
          </div>
        </div>

        <p className="mt-4 text-sm text-[#8BA3B8]">{t("cashNote")}</p>
        <div className="mt-6">
          {external ? (
            <a href={href} className={ctaClass}>
              {t("cta")}
            </a>
          ) : (
            <Link href="/" className={ctaClass}>
              {t("cta")}
            </Link>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-16">
        <Image
          src="/brand/banner-laptop.png"
          alt={home("laptopAlt")}
          width={1920}
          height={1080}
          className="h-auto w-full rounded-2xl border border-[#1E3A5F] shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
        />
        <p className="mt-10 text-center text-xs text-[#8BA3B8]">{t("footer")}</p>
      </section>
    </main>
  );
}
