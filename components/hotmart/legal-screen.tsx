import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SalesLegalFooter } from "@/components/hotmart/sales-legal-footer";

export async function LegalScreen({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const t = await getTranslations("legal");

  return (
    <main className="min-h-screen bg-[#0B1C33] text-[#F5F7FA]">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <p className="text-sm font-semibold tracking-wide text-[#D4AF37]">Radar Global</p>
        <h1 className="mt-4 text-3xl font-semibold text-[#D4AF37]">{title}</h1>
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-[#8BA3B8]">{children}</div>
        <SalesLegalFooter />
        <Link href="/" className="mt-8 inline-block text-sm text-[#D4AF37] hover:underline">
          ← {t("back")}
        </Link>
      </div>
    </main>
  );
}
