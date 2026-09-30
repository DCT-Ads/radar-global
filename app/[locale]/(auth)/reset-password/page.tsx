import { Suspense } from "react";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { Link } from "@/i18n/navigation";
import { assertLocale } from "@/i18n/routing";

type ResetPasswordPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ResetPasswordPage({ params }: ResetPasswordPageProps) {
  const { locale } = await params;
  setRequestLocale(assertLocale(locale));
  const t = await getTranslations();

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-background px-4">
      <div className="absolute right-6 top-6">
        <LocaleSwitcher />
      </div>
      <div className="flex w-full max-w-md flex-col items-center">
        <Image
          src="/brand/capa-produto.png"
          alt={t("home.coverAlt")}
          width={220}
          height={220}
          priority
          className="mb-4 h-auto w-40"
        />
        <Card className="w-full border-border/80 bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-2xl">{t("auth.resetTitle")}</CardTitle>
            <CardDescription>{t("auth.resetSubtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Suspense fallback={<p className="text-sm text-muted-foreground">{t("auth.resetSubtitle")}</p>}>
              <ResetPasswordForm />
            </Suspense>
            <p className="text-center text-sm text-muted-foreground">
              <Link href="/login" className="text-primary hover:underline">
                {t("auth.backToLogin")}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
