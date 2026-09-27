import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function SalesLegalFooter() {
  const t = await getTranslations("legal");

  return (
    <nav className="mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-[#8BA3B8]">
      <Link href="/privacidade" className="hover:text-[#D4AF37]">
        {t("privacy")}
      </Link>
      <Link href="/termos" className="hover:text-[#D4AF37]">
        {t("terms")}
      </Link>
      <Link href="/reembolso" className="hover:text-[#D4AF37]">
        {t("refund")}
      </Link>
      <Link href="/contato" className="hover:text-[#D4AF37]">
        {t("contact")}
      </Link>
    </nav>
  );
}
