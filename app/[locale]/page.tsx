import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { assertLocale } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(assertLocale(locale));
  const t = await getTranslations();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0B1C33] px-6 pb-16 pt-8 text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.14),transparent_45%)]" />
      <div className="absolute right-6 top-6 z-20">
        <LocaleSwitcher />
      </div>
      <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center">
        <Image
          src="/brand/capa-produto.png"
          alt={t("home.coverAlt")}
          width={720}
          height={720}
          priority
          className="h-auto w-full max-w-md"
        />
        <h1 className="sr-only">{t("home.headline")}</h1>
        <p className="mt-2 max-w-2xl text-center text-lg text-[#8BA3B8]">
          {t("home.subtitle")}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild>
            <Link href="/radar">{t("nav.explore")}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/login">{t("nav.login")}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/signup">{t("nav.signup")}</Link>
          </Button>
        </div>

        <Image
          src="/brand/banner-laptop.png"
          alt={t("home.laptopAlt")}
          width={1920}
          height={1080}
          className="mt-14 h-auto w-full rounded-2xl border border-[#1E3A5F] shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
        />
        <div className="mt-6 grid w-full gap-4 md:grid-cols-2">
          <Image
            src="/brand/tela-radar.png"
            alt={t("home.uiAlt")}
            width={1024}
            height={1024}
            className="h-auto w-full rounded-2xl border border-[#1E3A5F]"
          />
          <Image
            src="/brand/mockup-pc-celular.png"
            alt={t("home.devicesAlt")}
            width={1920}
            height={1080}
            className="h-auto w-full rounded-2xl border border-[#1E3A5F] object-cover"
          />
        </div>
      </div>
    </main>
  );
}
