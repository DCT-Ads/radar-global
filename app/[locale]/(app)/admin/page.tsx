import { getTranslations, setRequestLocale } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AdminPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AdminPage({ params }: AdminPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t("admin.title")}</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base text-primary">{t("admin.title")}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {t("admin.placeholder")}
        </CardContent>
      </Card>
    </div>
  );
}
