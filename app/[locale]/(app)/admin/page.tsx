import type { SourceStatus } from "@prisma/client";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RunCollectionButton } from "@/components/admin/run-collection-button";
import { prisma } from "@/lib/prisma";
import { ensureSources } from "@/lib/sources";

type AdminPageProps = {
  params: Promise<{ locale: string }>;
};

function statusVariant(status: SourceStatus) {
  if (status === "ACTIVE") {
    return "default" as const;
  }
  if (status === "ERROR") {
    return "destructive" as const;
  }
  return "outline" as const;
}

export default async function AdminPage({ params }: AdminPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");
  await ensureSources();

  const [sources, launches] = await Promise.all([
    prisma.source.findMany({ orderBy: { name: "asc" } }),
    prisma.launch.findMany({
      orderBy: { lastSeenAt: "desc" },
      take: 15,
      include: {
        _count: { select: { evidences: true, signals: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <RunCollectionButton />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base text-primary">{t("sourcesTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-muted-foreground">
              <tr className="border-b border-border">
                <th className="py-2 pr-4 font-medium">{t("colName")}</th>
                <th className="py-2 pr-4 font-medium">{t("colStatus")}</th>
                <th className="py-2 pr-4 font-medium">{t("colReliability")}</th>
                <th className="py-2 pr-4 font-medium">{t("colLastRun")}</th>
                <th className="py-2 font-medium">{t("colError")}</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((source) => (
                <tr key={source.id} className="border-b border-border/70">
                  <td className="py-3 pr-4">
                    <p className="font-medium">{source.name}</p>
                    <p className="text-xs text-muted-foreground">{source.slug}</p>
                  </td>
                  <td className="py-3 pr-4">
                    <Badge variant={statusVariant(source.status)}>{source.status}</Badge>
                  </td>
                  <td className="py-3 pr-4">{source.reliability}</td>
                  <td className="py-3 pr-4 text-muted-foreground">
                    {source.lastRunAt ? source.lastRunAt.toISOString() : t("never")}
                  </td>
                  <td className="py-3 text-destructive">{source.lastError ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base text-primary">{t("launchesTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {launches.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noLaunches")}</p>
          ) : (
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="py-2 pr-4 font-medium">{t("colDomain")}</th>
                  <th className="py-2 pr-4 font-medium">{t("colNiche")}</th>
                  <th className="py-2 pr-4 font-medium">{t("colLifecycle")}</th>
                  <th className="py-2 pr-4 font-medium">{t("colProbe")}</th>
                  <th className="py-2 font-medium">{t("colEvidence")}</th>
                </tr>
              </thead>
              <tbody>
                {launches.map((launch) => (
                  <tr key={launch.id} className="border-b border-border/70">
                    <td className="py-3 pr-4 font-medium">{launch.domain}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{launch.niche ?? "—"}</td>
                    <td className="py-3 pr-4">{launch.lifecycle}</td>
                    <td className="py-3 pr-4 text-xs text-muted-foreground">
                      {[
                        launch.landingLive ? "landing" : null,
                        launch.hasCheckout ? "checkout" : null,
                        launch.hasGoPath ? "go" : null,
                        launch.hasPayPath ? "pay" : null,
                      ]
                        .filter(Boolean)
                        .join(" · ") || t("noProbe")}
                    </td>
                    <td className="py-3">
                      {launch._count.evidences} / {launch._count.signals}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
