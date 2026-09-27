import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { PREMIUM_EUR_79, PREMIUM_EUR_PROMO } from "@/lib/auth/access";
import { hotmartCheckoutUrls } from "@/lib/hotmart-checkout";

type EspanolVariant = "promo227" | "mensual79" | "pressle79";

export async function OfertaEspanolLanding({
  variant = "promo227",
}: {
  variant?: EspanolVariant;
}) {
  const ns = variant === "promo227" ? "ofertaEspanol" : "ofertaEspanol79";
  const t = await getTranslations(ns);
  const home = await getTranslations("home");
  const checkout = hotmartCheckoutUrls();
  const href = variant === "promo227" ? checkout.premiumEsPromo : checkout.premiumEs79;
  const price = variant === "promo227" ? PREMIUM_EUR_PROMO : PREMIUM_EUR_79;
  const showPressle = variant !== "mensual79";
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
          <a href={href} className={ctaClass}>
            {t("cta")} · {price.monthlyLabel}
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

      <section className="mx-auto max-w-5xl px-6 pb-12">
        <h2 className="text-center text-2xl font-semibold text-[#D4AF37]">{t("whoTitle")}</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-[#8BA3B8]">{t("whoBody")}</p>
      </section>

      {showPressle ? <section className="mx-auto max-w-5xl px-6 pb-12">
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
            <h3 className="text-lg font-semibold text-[#D4AF37]">{t("howTitle")}</h3>
            <ol className="mt-3 space-y-3 text-sm text-[#8BA3B8]">
              <li>
                <span className="font-semibold text-[#F5F7FA]">1. {t("how1Title")}</span>
                <p className="mt-1">{t("how1Body")}</p>
              </li>
              <li>
                <span className="font-semibold text-[#F5F7FA]">2. {t("how2Title")}</span>
                <p className="mt-1">{t("how2Body")}</p>
              </li>
              <li>
                <span className="font-semibold text-[#F5F7FA]">3. {t("how3Title")}</span>
                <p className="mt-1">{t("how3Body")}</p>
              </li>
            </ol>
          </div>
        </div>
      </section> : null}

      <section id="planos" className="mx-auto max-w-5xl px-6 pb-12">
        <h2 className="mb-4 text-center text-2xl font-semibold text-[#D4AF37]">
          {t("plansTitle")}
        </h2>
        <div className="mx-auto max-w-xl rounded-2xl border border-[#D4AF37] bg-[#12263F]/80 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#D4AF37]">
            {t("promoBadge")}
          </p>
          <h3 className="mt-2 text-xl font-semibold text-[#D4AF37]">{t("premiumName")}</h3>
          <p className="mt-2 text-3xl font-semibold">{price.monthly}</p>
          <p className="text-xs text-[#8BA3B8]">{t("perMonth")}</p>
          <p className="mt-1 text-xs text-[#8BA3B8]">{price.cashNote}</p>
          <p className="text-xs text-[#8BA3B8]">{price.untilCancel}</p>
          <p className="mt-4 text-sm text-[#F5F7FA]">{t("premiumBody")}</p>
          <p className="mt-3 text-xs text-[#8BA3B8]">{t("honestNote")}</p>
          <ul className="mt-4 space-y-2 text-sm text-[#F5F7FA]">
            <li>✓ {t("premium1")}</li>
            <li>✓ {t("premium2")}</li>
            <li>✓ {t("premium3")}</li>
          </ul>
          <div className="mt-6">
            <a href={href} className={ctaClass}>
              {t("cta")}
            </a>
          </div>
        </div>
      </section>

      {showPressle ? (
        <>
      <section className="mx-auto max-w-3xl px-6 pb-12">
        <h2 className="text-center text-2xl font-semibold text-[#D4AF37]">{t("faqTitle")}</h2>
        <div className="mt-6 space-y-4 text-left">
          <div className="rounded-2xl border border-[#1E3A5F] bg-[#12263F]/80 p-5">
            <h3 className="text-sm font-semibold text-[#D4AF37]">{t("faq1Q")}</h3>
            <p className="mt-2 text-sm text-[#8BA3B8]">{t("faq1A")}</p>
          </div>
          <div className="rounded-2xl border border-[#1E3A5F] bg-[#12263F]/80 p-5">
            <h3 className="text-sm font-semibold text-[#D4AF37]">{t("faq2Q")}</h3>
            <p className="mt-2 text-sm text-[#8BA3B8]">{t("faq2A")}</p>
          </div>
          <div className="rounded-2xl border border-[#1E3A5F] bg-[#12263F]/80 p-5">
            <h3 className="text-sm font-semibold text-[#D4AF37]">{t("faq3Q")}</h3>
            <p className="mt-2 text-sm text-[#8BA3B8]">{t("faq3A")}</p>
          </div>
          <div className="rounded-2xl border border-[#1E3A5F] bg-[#12263F]/80 p-5">
            <h3 className="text-sm font-semibold text-[#D4AF37]">{t("faq4Q")}</h3>
            <p className="mt-2 text-sm text-[#8BA3B8]">{t("faq4A")}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-12 text-center">
        <h2 className="text-xl font-semibold text-[#D4AF37]">{t("companyTitle")}</h2>
        <p className="mt-2 text-sm text-[#8BA3B8]">{t("companyBody")}</p>
      </section>
        </>
      ) : null}

      <section className="mx-auto max-w-3xl px-6 pb-16 text-center">
        <h2 className="text-xl font-semibold text-[#D4AF37]">{t("guaranteeTitle")}</h2>
        <p className="mt-2 text-sm text-[#8BA3B8]">{t("guaranteeBody")}</p>
        <p className="mt-2 text-sm text-[#8BA3B8]">{t("refundOnPage")}</p>
        <div className="mt-6">
          <Button asChild variant="outline">
            <Link href="/login">{t("ctaLogin")}</Link>
          </Button>
        </div>
        <p className="mt-10 text-xs text-[#8BA3B8]">
          {t(
            variant === "pressle79"
              ? "footerPressle"
              : variant === "mensual79"
                ? "footerMensual"
                : "footer",
          )}
        </p>
        <nav className="mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-[#8BA3B8]">
          <Link href="/privacidade" className="hover:text-[#D4AF37]">
            Privacidad
          </Link>
          <Link href="/termos" className="hover:text-[#D4AF37]">
            Términos
          </Link>
          <Link href="/reembolso" className="hover:text-[#D4AF37]">
            Reembolso
          </Link>
          <Link href="/contato" className="hover:text-[#D4AF37]">
            Contacto
          </Link>
        </nav>
      </section>
    </main>
  );
}
