import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { INSTAGRAM_URL } from "@/lib/social";

type FunilVariant = "welcome" | "pending" | "credit" | "declined";

export async function FunilEspanolLanding({
  variant,
  footerKey,
}: {
  variant: FunilVariant;
  footerKey?: "footerGracias" | "footerBienvenido" | "footerMasTarde";
}) {
  const t = await getTranslations("funilEspanol");
  const home = await getTranslations("home");
  const showAccount = variant !== "declined";
  const kicker =
    variant === "welcome"
      ? t("welcomeKicker")
      : variant === "pending"
        ? t("pendingKicker")
        : variant === "credit"
          ? t("creditKicker")
          : t("declinedKicker");
  const headline =
    variant === "welcome"
      ? t("welcomeHeadline")
      : variant === "pending"
        ? t("pendingHeadline")
        : variant === "credit"
          ? t("creditHeadline")
          : t("declinedHeadline");
  const body =
    variant === "welcome"
      ? t("welcomeBody")
      : variant === "pending"
        ? t("pendingBody")
        : variant === "credit"
          ? t("creditBody")
          : t("declinedBody");
  const footer =
    footerKey === "footerBienvenido"
      ? t("footerBienvenido")
      : footerKey === "footerMasTarde"
        ? t("footerMasTarde")
        : variant === "declined"
          ? t("footerMasTarde")
          : t("footerGracias");

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
          {kicker}
        </p>
        <h1 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
          {headline}
        </h1>
        <p className="mt-4 max-w-xl text-base text-[#8BA3B8]">{body}</p>
        {showAccount ? (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex h-11 items-center justify-center rounded-md bg-[#D4AF37] px-6 text-sm font-semibold text-[#0B1C33] hover:bg-[#D4AF37]/90"
            >
              {t("ctaSignup")}
            </Link>
            <Link
              href="/login"
              className="inline-flex h-11 items-center justify-center rounded-md border border-[#D4AF37] bg-transparent px-6 text-sm font-semibold text-[#D4AF37] hover:bg-[#D4AF37]/10"
            >
              {t("ctaLogin")}
            </Link>
          </div>
        ) : (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/planes"
              className="inline-flex h-11 items-center justify-center rounded-md bg-[#D4AF37] px-6 text-sm font-semibold text-[#0B1C33] hover:bg-[#D4AF37]/90"
            >
              {t("backToPlanes")}
            </Link>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center justify-center rounded-md border border-[#D4AF37] bg-transparent px-6 text-sm font-semibold text-[#D4AF37] hover:bg-[#D4AF37]/10"
            >
              {t("ctaInstagram")}
            </a>
          </div>
        )}
        <p className="mt-12 text-xs text-[#8BA3B8]">{footer}</p>
      </section>
    </main>
  );
}
