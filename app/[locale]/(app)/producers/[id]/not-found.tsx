import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function ProducerNotFound() {
  const t = await getTranslations("radar");
  const common = await getTranslations("common");

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold">{t("producerNotFound")}</h1>
      <p className="text-sm text-muted-foreground">{common("insufficientData")}</p>
      <Link href="/radar" className="text-sm text-primary hover:underline">
        ← {t("backToRadar")}
      </Link>
    </div>
  );
}
