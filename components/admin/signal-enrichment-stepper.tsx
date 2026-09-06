import type { SignalStatus } from "@prisma/client";
import { ENRICHMENT_STEPS, enrichmentStepState } from "@/lib/signals/status-style";
import { cn } from "@/lib/utils";

export function SignalEnrichmentStepper({ status }: { status: SignalStatus }) {
  return (
    <ol className="flex flex-wrap items-center gap-2">
      {ENRICHMENT_STEPS.map((step, index) => {
        const state = enrichmentStepState(status, step);
        return (
          <li key={step} className="flex items-center gap-2">
            {index > 0 ? (
              <span
                className={cn(
                  "h-px w-8 sm:w-12",
                  state === "future" ? "bg-border" : "bg-emerald-500/70",
                )}
              />
            ) : null}
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs",
                state === "done" && "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
                state === "active" && "border-primary bg-primary/15 text-primary",
                state === "future" && "border-border text-muted-foreground",
              )}
            >
              {state === "done" ? <span aria-hidden>✓</span> : null}
              {step}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
