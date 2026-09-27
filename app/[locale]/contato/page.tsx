import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LegalScreen } from "@/components/hotmart/legal-screen";
import { INSTAGRAM_URL } from "@/lib/social";
import { assertLocale } from "@/i18n/routing";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legal");
  return { title: `Radar Global — ${t("contact")}`, description: t("contactLead") };
}

export default async function ContatoPage({ params }: PageProps) {
  setRequestLocale(assertLocale((await params).locale));
  const t = await getTranslations("legal");
  return (
    <LegalScreen title={t("contact")}>
      <p>{t("contactLead")}</p>
      <p>
        {t("contactSite")}{" "}
        <a href="https://radar.rotadomilhao.store" className="text-[#D4AF37] hover:underline">
          radar.rotadomilhao.store
        </a>
      </p>
      <p>
        {t("contactSocial")}{" "}
        <a href={INSTAGRAM_URL} className="text-[#D4AF37] hover:underline" target="_blank" rel="noreferrer">
          instagram.com/robertac8luly
        </a>
      </p>
      <p>{t("contactPay")}</p>
    </LegalScreen>
  );
}
