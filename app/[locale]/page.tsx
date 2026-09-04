import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.12),transparent_45%)]" />
      <div className="absolute right-6 top-6">
        <LocaleSwitcher />
      </div>
      <div className="relative z-10 flex max-w-2xl flex-col items-center text-center">
        <p className="mb-3 text-sm font-medium tracking-[0.2em] text-primary uppercase">
          {t("common.tagline")}
        </p>
        <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
          {t("home.headline")}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">{t("home.subtitle")}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild>
            <Link href="/signup">{t("nav.signup")}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/login">{t("nav.login")}</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
