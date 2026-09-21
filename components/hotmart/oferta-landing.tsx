import type { ReactNode } from "react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { PLAN_PRICES } from "@/lib/auth/access";
import { hotmartCheckoutUrls } from "@/lib/hotmart-checkout";

function BuyLink({
  href,
  fallbackHref,
  children,
  featured = false,
}: {
  href: string;
  fallbackHref: string;
  children: ReactNode;
  featured?: boolean;
}) {
  const target = href || fallbackHref;
  const external = target.startsWith("http");
  const className = featured
    ? "inline-flex h-11 items-center justify-center rounded-md bg-[#D4AF37] px-6 text-sm font-semibold text-[#0B1C33] hover:bg-[#D4AF37]/90"
    : "inline-flex h-11 items-center justify-center rounded-md border border-[#D4AF37] bg-transparent px-6 text-sm font-semibold text-[#D4AF37] hover:bg-[#D4AF37]/10";

  if (external) {
    return (
      <a href={target} className={className} target="_blank" rel="noreferrer">
        {children}
      </a>
    );
  }
  return (
    <Link href={target} className={className}>
      {children}
    </Link>
  );
}

export async function OfertaLanding() {
  const t = await getTranslations("oferta");
  const home = await getTranslations("home");
  const checkout = hotmartCheckoutUrls();

  return (
    <main className="relative min-h-screen bg-[#0B1C33] text-[#F5F7FA]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.16),transparent_55%)]" />
      <header className="relative z-10 mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <Link href="/" className="text-sm font-semibold tracking-wide text-[#D4AF37]">
          Radar Global
        </Link>
        <LocaleSwitcher />
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
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <BuyLink href={checkout.standard} fallbackHref="/signup">
            {t("ctaStandard")} · {PLAN_PRICES.STANDARD.monthly}
          </BuyLink>
          <BuyLink href={checkout.premium} fallbackHref="/signup" featured>
            {t("ctaPremium")} · {PLAN_PRICES.PREMIUM.monthly}
          </BuyLink>
        </div>
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

      <section className="mx-auto max-w-5xl px-6 pb-12">
        <h2 className="mb-4 text-center text-2xl font-semibold text-[#D4AF37]">
          {t("whatTitle")}
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
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

      <section className="mx-auto max-w-5xl px-6 pb-8">
        <h2 className="text-center text-2xl font-semibold text-[#D4AF37]">{t("whoTitle")}</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-[#8BA3B8]">{t("whoBody")}</p>
      </section>

      <section id="planos" className="mx-auto max-w-5xl px-6 pb-12">
        <h2 className="mb-4 text-center text-2xl font-semibold text-[#D4AF37]">
          {t("plansTitle")}
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-[#1E3A5F] bg-[#12263F]/80 p-6">
            <h3 className="text-xl font-semibold text-[#D4AF37]">{t("standardName")}</h3>
            <p className="mt-2 text-3xl font-semibold">{PLAN_PRICES.STANDARD.monthly}</p>
            <p className="text-xs text-[#8BA3B8]">{t("perMonth")}</p>
            <ul className="mt-4 space-y-2 text-sm text-[#8BA3B8]">
              <li>✓ {t("standard1")}</li>
              <li>✓ {t("standard2")}</li>
              <li>✓ {t("standard3")}</li>
            </ul>
            <div className="mt-6">
              <BuyLink href={checkout.standard} fallbackHref="/signup">
                {t("ctaStandard")}
              </BuyLink>
            </div>
          </div>
          <div className="rounded-2xl border border-[#D4AF37] bg-[#12263F]/80 p-6">
            <h3 className="text-xl font-semibold text-[#D4AF37]">{t("premiumName")}</h3>
            <p className="mt-2 text-3xl font-semibold">{PLAN_PRICES.PREMIUM.monthly}</p>
            <p className="text-xs text-[#8BA3B8]">{t("perMonth")}</p>
            <ul className="mt-4 space-y-2 text-sm text-[#F5F7FA]">
              <li>✓ {t("premium1")}</li>
              <li>✓ {t("premium2")}</li>
              <li>✓ {t("premium3")}</li>
            </ul>
            <div className="mt-6">
              <BuyLink href={checkout.premium} fallbackHref="/signup" featured>
                {t("ctaPremium")}
              </BuyLink>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-16 text-center">
        <h2 className="text-xl font-semibold text-[#D4AF37]">{t("guaranteeTitle")}</h2>
        <p className="mt-2 text-sm text-[#8BA3B8]">{t("guaranteeBody")}</p>
        <div className="mt-6">
          <Button asChild variant="outline">
            <Link href="/login">{t("ctaLogin")}</Link>
          </Button>
        </div>
        <p className="mt-10 text-xs text-[#8BA3B8]">{t("footer")}</p>
      </section>
    </main>
  );
}
