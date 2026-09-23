import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { HotmartSalesFunnel } from "@/components/hotmart/hotmart-sales-funnel";

export async function UpsellLanding() {
  const t = await getTranslations("upsell");
  const home = await getTranslations("home");

  return (
    <main className="relative min-h-screen bg-[#0B1C33] text-[#F5F7FA]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.16),transparent_55%)]" />
      <header className="relative z-10 mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
        <p className="text-sm font-semibold tracking-wide text-[#D4AF37]">Radar Global</p>
        <p className="rounded-full border border-[#D4AF37] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#D4AF37]">
          {t("lock")}
        </p>
      </header>

      <section className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-6 pb-16 pt-4 text-center">
        <Image
          src="/brand/capa-produto.png"
          alt={home("coverAlt")}
          width={420}
          height={420}
          priority
          className="h-auto w-full max-w-[220px]"
        />
        <p className="mt-4 text-xs font-medium uppercase tracking-[0.22em] text-[#D4AF37]">
          {t("kicker")}
        </p>
        <h1 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("headline")}
        </h1>
        <p className="mt-4 max-w-xl text-base text-[#8BA3B8]">{t("subtitle")}</p>

        <HotmartSalesFunnel />

        <div className="mt-8 flex w-full flex-col items-center gap-3">
          <Link
            href="/outra-oportunidade"
            className="inline-flex h-11 w-full max-w-md items-center justify-center rounded-md border border-[#D4AF37] bg-transparent px-6 text-sm font-semibold text-[#D4AF37] hover:bg-[#D4AF37]/10"
          >
            {t("ctaNo")}
          </Link>
        </div>
        <p className="mt-10 text-xs text-[#8BA3B8]">{t("footer")}</p>
      </section>
    </main>
  );
}
