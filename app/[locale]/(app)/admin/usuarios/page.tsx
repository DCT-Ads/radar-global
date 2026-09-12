import { getTranslations, setRequestLocale } from "next-intl/server";
import { AdminTabs } from "@/components/admin/admin-tabs";
import { UserPlanTable } from "@/components/admin/user-plan-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { assertLocale } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";

type UsersPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AdminUsersPage({ params }: UsersPageProps) {
  const { locale } = await params;
  setRequestLocale(assertLocale(locale));
  const t = await getTranslations("admin");
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, role: true, plan: true },
  });

  return (
    <div className="space-y-6">
      <AdminTabs active="usuarios" />
      <Card>
        <CardHeader>
          <CardTitle className="text-base text-primary">{t("usersTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <UserPlanTable
            users={users}
            labels={{
              name: t("usersName"),
              email: t("usersEmail"),
              role: t("usersRole"),
              plan: t("usersPlan"),
              standard: t("planStandard"),
              premium: t("planPremium"),
              saved: t("usersPlanSaved"),
              error: t("usersPlanError"),
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
