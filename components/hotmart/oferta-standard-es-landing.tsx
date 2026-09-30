import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { SalesLegalFooter } from "@/components/hotmart/sales-legal-footer";
import { PressleSitelinkScroll } from "@/components/hotmart/pressle-sitelink-scroll";
import { StandardEsOrderBump } from "@/components/hotmart/standard-es-order-bump";
import { STANDARD_EUR, STANDARD_EUR_ANNUAL } from "@/lib/auth/access";
import { hotmartCheckoutUrls } from "@/lib/hotmart-checkout";

const ctaClass =
  "inline-flex h-11 items-center justify-center rounded-md bg-[#D4AF37] px-6 text-sm font-semibold text-[#0B1C33] hover:bg-[#D4AF37]/90";

const ctaOutlineClass =
  "inline-flex h-11 items-center justify-center rounded-md border border-[#D4AF37] bg-transparent px-6 text-sm font-semibold text-[#D4AF37] hover:bg-[#D4AF37]/10";

function PayLink({
  href,
  featured,
  pending,
  children,
}: {
  href: string;
  featured?: boolean;
  pending: string;
  children: string;
}) {
  if (!href) {
    return <p className="mt-6 text-xs text-[#8BA3B8]">{pending}</p>;
  }

  return (
    <div className="mt-6">
      <a href={href} className={featured ? ctaClass : ctaOutlineClass}>
        {children}
      </a>
    </div>
  );
}

export async function OfertaStandardEsLanding({
  variant = "cards",
}: {
  variant?: "cards" | "pressle";
}) {
  const t = await getTranslations("ofertaStandardEs");
  const home = await getTranslations("home");
  const checkout = hotmartCheckoutUrls();
  const price = {
    monthly: STANDARD_EUR.monthly,
    annual: STANDARD_EUR_ANNUAL.total,
    was: STANDARD_EUR_ANNUAL.was,
    save: STANDARD_EUR_ANNUAL.save,
  };

  return (
    <main className="relative min-h-screen bg-[#0B1C33] text-[#F5F7FA]">
      <PressleSitelinkScroll />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.16),transparent_55%)]" />
      <header className="relative z-10 mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <p className="text-sm font-semibold tracking-wide text-[#D4AF37]">Radar Global</p>
        <p className="rounded-full border border-[#D4AF37] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#D4AF37]">
          {t("lock")}
        </p>
      </header>

      <section className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-6 pb-12 pt-4 text-center">
        <Image
          src="/brand/capa-produto-es.png"
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
        <div className="mt-8">
          <a href="#planos" className={ctaClass}>
            {t("cta")}
          </a>
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

      <section className="mx-auto max-w-3xl px-6 pb-12">
        <h2 className="text-center text-2xl font-semibold text-[#D4AF37]">{t("problemTitle")}</h2>
        <ul className="mx-auto mt-6 max-w-xl space-y-3 text-sm text-[#8BA3B8]">
          <li>— {t("problem1")}</li>
          <li>— {t("problem2")}</li>
          <li>— {t("problem3")}</li>
          <li>— {t("problem4")}</li>
        </ul>
        <p className="mx-auto mt-6 max-w-xl text-center text-sm text-[#F5F7FA]">{t("problemClose")}</p>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-12">
        <h2 className="mb-3 text-center text-2xl font-semibold text-[#D4AF37]">{t("solutionTitle")}</h2>
        <p className="mx-auto mb-6 max-w-2xl text-center text-sm text-[#8BA3B8]">{t("solutionBody")}</p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-[#1E3A5F] bg-[#12263F]/80 p-5">
            <h3 className="text-lg font-semibold text-[#D4AF37]">{t("feat1Title")}</h3>
            <p className="mt-2 text-sm text-[#8BA3B8]">{t("feat1Body")}</p>
          </div>
          <div className="rounded-2xl border border-[#1E3A5F] bg-[#12263F]/80 p-5">
            <h3 className="text-lg font-semibold text-[#D4AF37]">{t("feat2Title")}</h3>
            <p className="mt-2 text-sm text-[#8BA3B8]">{t("feat2Body")}</p>
          </div>
          <div className="rounded-2xl border border-[#1E3A5F] bg-[#12263F]/80 p-5">
            <h3 className="text-lg font-semibold text-[#D4AF37]">{t("feat3Title")}</h3>
            <p className="mt-2 text-sm text-[#8BA3B8]">{t("feat3Body")}</p>
          </div>
          <div className="rounded-2xl border border-[#1E3A5F] bg-[#12263F]/80 p-5">
            <h3 className="text-lg font-semibold text-[#D4AF37]">{t("feat4Title")}</h3>
            <p className="mt-2 text-sm text-[#8BA3B8]">{t("feat4Body")}</p>
          </div>
        </div>
      </section>

      <section id="demostracion" className="mx-auto grid max-w-5xl scroll-mt-8 gap-4 px-6 pb-12 md:grid-cols-2">
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

      <section className="mx-auto max-w-3xl px-6 pb-12">
        <blockquote className="rounded-2xl border border-[#D4AF37]/50 bg-[#12263F]/80 px-6 py-8 text-center">
          <p className="text-base text-[#F5F7FA] sm:text-lg">{t("bridge1")}</p>
          <p className="mt-4 text-base text-[#F5F7FA] sm:text-lg">{t("bridge2")}</p>
          <p className="mt-4 text-xs text-[#8BA3B8]">{t("bridgeNote")}</p>
        </blockquote>
      </section>

      <section id="como-funciona" className="mx-auto max-w-5xl scroll-mt-8 px-6 pb-12">
        <h2 className="mb-4 text-center text-2xl font-semibold text-[#D4AF37]">{t("howTitle")}</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-[#1E3A5F] bg-[#12263F]/80 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#D4AF37]">01</p>
            <h3 className="mt-2 text-lg font-semibold">{t("how1Title")}</h3>
            <p className="mt-2 text-sm text-[#8BA3B8]">{t("how1Body")}</p>
          </div>
          <div className="rounded-2xl border border-[#1E3A5F] bg-[#12263F]/80 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#D4AF37]">02</p>
            <h3 className="mt-2 text-lg font-semibold">{t("how2Title")}</h3>
            <p className="mt-2 text-sm text-[#8BA3B8]">{t("how2Body")}</p>
          </div>
          <div className="rounded-2xl border border-[#1E3A5F] bg-[#12263F]/80 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#D4AF37]">03</p>
            <h3 className="mt-2 text-lg font-semibold">{t("how3Title")}</h3>
            <p className="mt-2 text-sm text-[#8BA3B8]">{t("how3Body")}</p>
          </div>
        </div>
      </section>

      <section id="casos" className="mx-auto max-w-5xl scroll-mt-8 px-6 pb-12">
        <h2 className="text-center text-2xl font-semibold text-[#D4AF37]">{t("casosTitle")}</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-[#8BA3B8]">{t("casosLead")}</p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-[#1E3A5F] bg-[#12263F]/80 p-5">
            <h3 className="text-lg font-semibold text-[#D4AF37]">{t("casos1Title")}</h3>
            <p className="mt-2 text-sm text-[#8BA3B8]">{t("casos1Body")}</p>
          </div>
          <div className="rounded-2xl border border-[#1E3A5F] bg-[#12263F]/80 p-5">
            <h3 className="text-lg font-semibold text-[#D4AF37]">{t("casos2Title")}</h3>
            <p className="mt-2 text-sm text-[#8BA3B8]">{t("casos2Body")}</p>
          </div>
          <div className="rounded-2xl border border-[#1E3A5F] bg-[#12263F]/80 p-5">
            <h3 className="text-lg font-semibold text-[#D4AF37]">{t("casos3Title")}</h3>
            <p className="mt-2 text-sm text-[#8BA3B8]">{t("casos3Body")}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-12">
        <h2 className="mb-4 text-center text-2xl font-semibold text-[#D4AF37]">{t("isTitle")}</h2>
        <p className="mx-auto mb-6 max-w-2xl text-center text-sm text-[#8BA3B8]">{t("isBody")}</p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-[#1E3A5F] bg-[#12263F]/80 p-5">
            <h3 className="text-lg font-semibold text-[#D4AF37]">{t("isNotTitle")}</h3>
            <ul className="mt-3 space-y-2 text-sm text-[#8BA3B8]">
              <li>— {t("isNot1")}</li>
              <li>— {t("isNot2")}</li>
              <li>— {t("isNot3")}</li>
              <li>— {t("isNot4")}</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-[#1E3A5F] bg-[#12263F]/80 p-5">
            <h3 className="text-lg font-semibold text-[#D4AF37]">{t("mindTitle")}</h3>
            <p className="mt-3 text-sm text-[#F5F7FA]">{t("mindLead")}</p>
            <ul className="mt-3 space-y-3 text-sm text-[#8BA3B8]">
              <li>
                <span className="font-semibold text-[#F5F7FA]">{t("mind1Title")}</span>
                <p className="mt-1">{t("mind1Body")}</p>
              </li>
              <li>
                <span className="font-semibold text-[#F5F7FA]">{t("mind2Title")}</span>
                <p className="mt-1">{t("mind2Body")}</p>
              </li>
              <li>
                <span className="font-semibold text-[#F5F7FA]">{t("mind3Title")}</span>
                <p className="mt-1">{t("mind3Body")}</p>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section id="planos" className="mx-auto max-w-5xl scroll-mt-8 px-6 pb-12">
        <h2 className="mb-4 text-center text-2xl font-semibold text-[#D4AF37]">{t("plansTitle")}</h2>
        {variant === "pressle" ? (
          <div className="mx-auto max-w-xl rounded-2xl border border-[#D4AF37] bg-[#12263F]/80 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#D4AF37]">
              {t("monthlyBadge")}
            </p>
            <h3 className="mt-2 text-xl font-semibold text-[#D4AF37]">{t("monthlyName")}</h3>
            <p className="mt-2 text-3xl font-semibold">{price.monthly}</p>
            <p className="text-xs text-[#8BA3B8]">{t("perMonth")}</p>
            <p className="mt-1 text-xs text-[#8BA3B8]">{STANDARD_EUR.cashNote}</p>
            <p className="text-xs text-[#8BA3B8]">{STANDARD_EUR.untilCancel}</p>
            <ul className="mt-4 space-y-2 text-sm text-[#F5F7FA]">
              <li>✓ {t("monthly1")}</li>
              <li>✓ {t("monthly2")}</li>
              <li>✓ {t("monthly3")}</li>
              <li>✓ {t("monthly4")}</li>
              <li>✓ {t("monthly5")}</li>
            </ul>
            <p className="mt-3 text-xs text-[#8BA3B8]">{t("honestNote")}</p>
            <StandardEsOrderBump
              monthlyHref={checkout.standardEs}
              annualHref={checkout.standardEsAnnual}
              annualPrice={price.annual}
              copy={{
                bumpBadge: t("bumpBadge"),
                bumpTitle: t("bumpTitle"),
                bumpBody: t("bumpBody", price),
                bumpWas: t("bumpWas", price),
                bumpTotal: t("bumpTotal", price),
                ctaMonthly: t("ctaBumpMonthly", price),
                ctaBump: t("ctaBumpAnnual", price),
              }}
            />
          </div>
        ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-[#1E3A5F] bg-[#12263F]/80 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#D4AF37]">
              {t("monthlyBadge")}
            </p>
            <h3 className="mt-2 text-xl font-semibold text-[#D4AF37]">{t("monthlyName")}</h3>
            <p className="mt-2 text-3xl font-semibold">{price.monthly}</p>
            <p className="text-xs text-[#8BA3B8]">{t("perMonth")}</p>
            <p className="mt-1 text-xs text-[#8BA3B8]">{STANDARD_EUR.cashNote}</p>
            <p className="text-xs text-[#8BA3B8]">{STANDARD_EUR.untilCancel}</p>
            <ul className="mt-4 space-y-2 text-sm text-[#F5F7FA]">
              <li>✓ {t("monthly1")}</li>
              <li>✓ {t("monthly2")}</li>
              <li>✓ {t("monthly3")}</li>
              <li>✓ {t("monthly4")}</li>
              <li>✓ {t("monthly5")}</li>
            </ul>
            <p className="mt-3 text-xs text-[#8BA3B8]">{t("honestNote")}</p>
            <PayLink href={checkout.standardEs} pending={t("checkoutPending")}>
              {t("ctaMonthly")}
            </PayLink>
          </div>

          <div className="rounded-2xl border border-[#D4AF37] bg-[#12263F]/80 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#D4AF37]">
              {t("annualBadge")}
            </p>
            <h3 className="mt-2 text-xl font-semibold text-[#D4AF37]">{t("annualName")}</h3>
            <p className="mt-2 text-3xl font-semibold">{price.annual}</p>
            <p className="text-xs text-[#8BA3B8]">{t("perYear")}</p>
            <p className="mt-2 text-sm text-[#8BA3B8] line-through">{price.was}</p>
            <p className="mt-1 text-sm text-[#D4AF37]">
              {t("annualSave", { save: price.save })}
            </p>
            <p className="mt-1 text-xs text-[#8BA3B8]">{t("annualNote")}</p>
            <ul className="mt-4 space-y-2 text-sm text-[#F5F7FA]">
              <li>✓ {t("annual1")}</li>
              <li>✓ {t("annual2")}</li>
            </ul>
            <p className="mt-3 text-xs text-[#8BA3B8]">{t("honestNote")}</p>
            <PayLink href={checkout.standardEsAnnual} featured pending={t("checkoutPending")}>
              {t("ctaAnnual")}
            </PayLink>
          </div>
        </div>
        )}
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-12 text-center">
        <h2 className="text-2xl font-semibold text-[#D4AF37]">{t("communityTitle")}</h2>
        <p className="mt-3 text-sm text-[#8BA3B8]">{t("communityBody")}</p>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-12">
        <h2 className="text-center text-2xl font-semibold text-[#D4AF37]">{t("faqTitle")}</h2>
        <div className="mt-6 space-y-4 text-left">
          <div className="rounded-2xl border border-[#1E3A5F] bg-[#12263F]/80 p-5">
            <h3 className="text-sm font-semibold text-[#D4AF37]">{t("faq1Q")}</h3>
            <p className="mt-2 text-sm text-[#8BA3B8]">{t("faq1A")}</p>
          </div>
          <div className="rounded-2xl border border-[#1E3A5F] bg-[#12263F]/80 p-5">
            <h3 className="text-sm font-semibold text-[#D4AF37]">{t("faq2Q")}</h3>
            <p className="mt-2 text-sm text-[#8BA3B8]">
              {t("faq2A", price)}
            </p>
          </div>
          <div className="rounded-2xl border border-[#1E3A5F] bg-[#12263F]/80 p-5">
            <h3 className="text-sm font-semibold text-[#D4AF37]">{t("faq3Q")}</h3>
            <p className="mt-2 text-sm text-[#8BA3B8]">{t("faq3A")}</p>
          </div>
          <div className="rounded-2xl border border-[#1E3A5F] bg-[#12263F]/80 p-5">
            <h3 className="text-sm font-semibold text-[#D4AF37]">{t("faq4Q")}</h3>
            <p className="mt-2 text-sm text-[#8BA3B8]">{t("faq4A", price)}</p>
          </div>
          <div className="rounded-2xl border border-[#1E3A5F] bg-[#12263F]/80 p-5">
            <h3 className="text-sm font-semibold text-[#D4AF37]">{t("faq5Q")}</h3>
            <p className="mt-2 text-sm text-[#8BA3B8]">{t("faq5A")}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-12 text-center">
        <h2 className="text-2xl font-semibold text-[#D4AF37]">{t("finalTitle")}</h2>
        <p className="mt-3 text-sm text-[#8BA3B8]">{t("finalBody")}</p>
        <div className="mt-6">
          <a href="#planos" className={ctaClass}>
            {t("ctaFinal")}
          </a>
        </div>
        <p className="mt-4 text-xs text-[#8BA3B8]">{t("payNote")}</p>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-12 text-center">
        <h2 className="text-xl font-semibold text-[#D4AF37]">{t("companyTitle")}</h2>
        <p className="mt-2 text-sm text-[#8BA3B8]">{t("companyBody")}</p>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-16 text-center">
        <h2 className="text-xl font-semibold text-[#D4AF37]">{t("guaranteeTitle")}</h2>
        <p className="mt-2 text-sm text-[#8BA3B8]">{t("guaranteeBody", price)}</p>
        <p className="mt-2 text-sm text-[#8BA3B8]">{t("refundOnPage")}</p>
        <div className="mt-6">
          <Button asChild variant="outline">
            <Link href="/login">{t("ctaLogin")}</Link>
          </Button>
        </div>
        <p className="mt-10 text-xs text-[#8BA3B8]">
          {t(variant === "pressle" ? "footerPressle" : "footer")}
        </p>
        <SalesLegalFooter />
      </section>
    </main>
  );
}
