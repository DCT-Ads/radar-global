"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export function RunCollectionButton() {
  const t = useTranslations("admin");
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onRun() {
    setPending(true);
    setMessage(null);
    const response = await fetch("/api/admin/collect", { method: "POST" });
    setPending(false);

    if (!response.ok) {
      setMessage(t("runError"));
      return;
    }

    const payload = (await response.json()) as { mode?: string };
    setMessage(payload.mode === "queued" ? t("runQueued") : t("runDone"));
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button type="button" onClick={onRun} disabled={pending}>
        {pending ? t("running") : t("runNow")}
      </Button>
      {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
    </div>
  );
}
