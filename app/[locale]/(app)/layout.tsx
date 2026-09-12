import { setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { assertLocale } from "@/i18n/routing";
import { getCurrentUser } from "@/lib/auth/session";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";

type AppLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function AppLayout({ children, params }: AppLayoutProps) {
  const locale = assertLocale((await params).locale);
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) {
    redirect({ href: "/login", locale });
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar role={user.role} plan={user.plan} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar
          user={{ name: user.name, email: user.email, role: user.role, plan: user.plan }}
        />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
