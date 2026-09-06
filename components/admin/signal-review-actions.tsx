"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";

type SignalReviewActionsProps = {
  signalId: string;
  canReview: boolean;
};

export function SignalReviewActions({ signalId, canReview }: SignalReviewActionsProps) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [pending, setPending] = useState<"verify" | "discard" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(action: "verify" | "discard") {
    setPending(action);
    setError(null);
    const response = await fetch(`/api/admin/signals/${signalId}/${action}`, {
      method: "POST",
    });
    setPending(null);

    if (!response.ok) {
      setError(action === "verify" ? t("verifyError") : t("discardError"));
      return;
    }

    router.refresh();
  }

  if (!canReview) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          onClick={() => run("verify")}
          disabled={pending !== null}
        >
          {pending === "verify" ? t("verifying") : t("verify")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => run("discard")}
          disabled={pending !== null}
        >
          {pending === "discard" ? t("discarding") : t("discard")}
        </Button>
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
