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

  return <CopyGenerator />;
}
