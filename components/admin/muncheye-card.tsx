"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useRouter } from "@/i18n/navigation";
import type { MuncheyeCardStats } from "@/lib/collectors/marketplace/run-muncheye";
import { cn } from "@/lib/utils";

function statsFrom(data: MuncheyeCardStats): MuncheyeCardStats {
  return {
    active: data.active,
    lastCollectAgo: data.lastCollectAgo,
    newLaunches: data.newLaunches,
    enriched: data.enriched,
    missingKeywords: data.missingKeywords,
    autoDaily: data.autoDaily,
    lastError: data.lastError ?? null,
  };
}

export function MuncheyeCard({ stats: initial }: { stats: MuncheyeCardStats }) {
  const t = useTranslations("admin");
  const locale = useLocale();
  const router = useRouter();
  const [stats, setStats] = useState(initial);
  const [running, setRunning] = useState(false);
  const [toggling, setToggling] = useState(false);

  async function handleCollect() {
    setRunning(true);
    try {
      const response = await fetch(
        `/api/admin/collectors/muncheye/run?locale=${encodeURIComponent(locale)}`,
        { method: "POST" },
      );
      const data = (await response.json()) as MuncheyeCardStats & {
        created?: number;
        error?: string;
      };
      if (!response.ok) {
        toast.error(t("muncheyeCollectError"));
        return;
      }
      setStats(statsFrom(data));
      toast.success(t("muncheyeCollectOk", { count: data.created ?? 0 }));
      router.refresh();
    } catch {
      toast.error(t("muncheyeCollectError"));
    } finally {
      setRunning(false);
    }
  }

  async function handleToggle() {
    const next = !stats.autoDaily;
    setToggling(true);
    try {
      const response = await fetch(
        `/api/admin/collectors/muncheye/toggle?locale=${encodeURIComponent(locale)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enabled: next }),
        },
      );
      const data = (await response.json()) as MuncheyeCardStats & { error?: string };
      if (!response.ok) {
        toast.error(t("muncheyeToggleError"));
        return;
      }
      setStats(statsFrom(data));
      router.refresh();
    } catch {
      toast.error(t("muncheyeToggleError"));
    } finally {
      setToggling(false);
    }
  }

  return (
    <Card className="transition-colors hover:border-primary/40">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-base text-primary">{t("muncheyeTitle")}</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">{t("muncheyeHint")}</p>
          <p className="text-xs text-muted-foreground">{t("muncheyeHint2")}</p>
        </div>
        <Badge variant={stats.active ? "default" : "outline"}>
          {stats.active ? t("muncheyeActive") : t("muncheyeInactive")}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">{t("muncheyeLastCollect")}</span>
            <span>{stats.lastCollectAgo}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">{t("muncheyeNewLaunches")}</span>
            <span>{stats.newLaunches}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">{t("muncheyeEnriched")}</span>
            <span>{stats.enriched}</span>
          </div>
          {stats.lastError ? (
            <p className="text-xs text-destructive">{stats.lastError}</p>
          ) : null}
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            className="flex-1"
            onClick={() => void handleCollect()}
            disabled={running}
          >
            {running ? t("muncheyeCollecting") : t("muncheyeCollectNow")}
          </Button>
          <Button type="button" variant="outline" className="flex-1" asChild>
            <Link href="/admin?tab=collectors">{t("muncheyeViewLogs")}</Link>
          </Button>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-3">
          <span className="text-sm text-muted-foreground">{t("muncheyeAutoDaily")}</span>
          <button
            type="button"
            role="switch"
            aria-checked={stats.autoDaily}
            disabled={toggling}
            onClick={() => void handleToggle()}
            className={cn(
              "relative h-6 w-11 rounded-full transition-colors disabled:opacity-50",
              stats.autoDaily ? "bg-primary" : "bg-muted",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 h-5 w-5 rounded-full bg-background shadow-sm transition-[left]",
                stats.autoDaily ? "left-5" : "left-0.5",
              )}
            />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
