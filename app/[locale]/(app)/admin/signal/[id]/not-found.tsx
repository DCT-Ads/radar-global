import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function SignalNotFound() {
  const t = await getTranslations("admin");

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold">{t("signalNotFound")}</h1>
      <p className="text-sm text-muted-foreground">{t("signalNotFoundHint")}</p>
      <Link href="/admin" className="text-sm text-primary hover:underline">
        ← {t("backToQueue")}
      </Link>
    </div>
  );
}
