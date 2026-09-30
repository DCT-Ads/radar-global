import { setRequestLocale } from "next-intl/server";
import { AlertCenter } from "@/components/alerts/alert-center";
import { assertLocale } from "@/i18n/routing";

type AlertsPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AlertsPage({ params }: AlertsPageProps) {
  const { locale } = await params;
  setRequestLocale(assertLocale(locale));
  return <AlertCenter />;
}
