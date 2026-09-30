import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { CopyGenerator } from "@/components/copy/copy-generator";
import { requirePremiumPage } from "@/lib/auth/require-feature";
import { assertLocale } from "@/i18n/routing";

type CopyPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function CopyPage({ params }: CopyPageProps) {
  const { locale } = await params;
  setRequestLocale(assertLocale(locale));
  await requirePremiumPage(locale);

  return (
    <Suspense
      fallback={
        <div className="min-h-full rounded-2xl bg-gradient-to-br from-[#0B1A2F] to-[#12263F] p-6 md:p-10">
          <p className="text-sm text-[#8BA3B8]">…</p>
        </div>
      }
    >
      <CopyGenerator />
    </Suspense>
  );
}
