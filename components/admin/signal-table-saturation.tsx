import type { SaturationLevel } from "@/lib/signals/saturation";

const LEVEL_UI: Record<
  SaturationLevel,
  { cls: string; labelKey: "hot" | "moderate" | "saturated" }
> = {
  SAFE: { cls: "bg-green-600 text-white animate-pulse", labelKey: "hot" },
  WARNING: { cls: "bg-yellow-500 text-black animate-pulse", labelKey: "moderate" },
  SATURATED: { cls: "bg-red-600 text-white animate-pulse", labelKey: "saturated" },
};

type SignalTableSaturationProps = {
  level: SaturationLevel | null;
  upcoming?: boolean;
  labels: {
    hot: string;
    moderate: string;
    saturated: string;
    upcomingLaunch: string;
    unknown?: string;
  };
};

export function SignalTableSaturation({
  level,
  upcoming,
  labels,
}: SignalTableSaturationProps) {
  const ui = level ? LEVEL_UI[level] : null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {ui ? (
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${ui.cls}`}>
          {labels[ui.labelKey]}
        </span>
      ) : (
        <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">
          {labels.unknown ?? "—"}
        </span>
      )}
      {upcoming ? (
        <span className="rounded-full bg-blue-600 px-2.5 py-0.5 text-xs font-bold text-white animate-pulse">
          {labels.upcomingLaunch}
        </span>
      ) : null}
    </div>
  );
}
