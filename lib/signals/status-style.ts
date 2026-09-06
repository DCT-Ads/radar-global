import type { SignalStatus } from "@prisma/client";

export const ENRICHMENT_STEPS: Exclude<SignalStatus, "DISCARDED">[] = [
  "NEW",
  "ENRICHING",
  "CANDIDATE",
  "VERIFIED",
];

export function signalStatusClassName(status: SignalStatus) {
  if (status === "NEW") {
    return "border-zinc-500/40 bg-zinc-500/15 text-zinc-300";
  }
  if (status === "ENRICHING") {
    return "border-yellow-500/40 bg-yellow-500/15 text-yellow-300";
  }
  if (status === "CANDIDATE") {
    return "border-blue-500/40 bg-blue-500/15 text-blue-300";
  }
  if (status === "VERIFIED") {
    return "border-emerald-500/40 bg-emerald-500/15 text-emerald-300";
  }
  return "border-red-500/40 bg-red-500/15 text-red-300";
}

export function enrichmentStepState(
  current: SignalStatus,
  step: (typeof ENRICHMENT_STEPS)[number],
) {
  if (current === "DISCARDED") {
    return "future" as const;
  }
  const currentIndex = ENRICHMENT_STEPS.indexOf(current);
  const stepIndex = ENRICHMENT_STEPS.indexOf(step);
  if (stepIndex < currentIndex) {
    return "done" as const;
  }
  if (stepIndex === currentIndex) {
    return "active" as const;
  }
  return "future" as const;
}
