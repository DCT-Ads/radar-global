import { setRequestLocale } from "next-intl/server";
import { ChatBox } from "@/components/chat/chat-box";
import { requirePremiumPage } from "@/lib/auth/require-feature";
import { assertLocale } from "@/i18n/routing";

type ChatPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ChatPage({ params }: ChatPageProps) {
  const { locale } = await params;
  setRequestLocale(assertLocale(locale));
  await requirePremiumPage(locale);

  return (
    <div className="min-h-full rounded-2xl bg-gradient-to-br from-[#0B1A2F] to-[#12263F] p-6 md:p-10">
      <ChatBox />
    </div>
  );
}
