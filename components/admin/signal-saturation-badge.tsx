import {
  getSaturationLevel,
  type SaturationInputs,
} from "@/lib/signals/saturation";

const SATURATION_UI = {
  SATURATED: {
    labelKey: "saturationSaturated",
    cls: "bg-red-600 text-white animate-pulse",
  },
  WARNING: {
    labelKey: "saturationWarning",
    cls: "bg-yellow-500 text-black animate-pulse",
  },
  SAFE: {
    labelKey: "saturationSafe",
    cls: "bg-green-600 text-white animate-pulse",
  },
} as const;

type SignalSaturationBadgeProps = {
  inputs: SaturationInputs;
  upcoming?: boolean;
  labels: {
    saturationSaturated: string;
    saturationWarning: string;
    saturationSafe: string;
    saturationUnknown?: string;
    upcomingLaunch: string;
  };
};

export function SignalSaturationBadge({
  inputs,
  upcoming,
  labels,
}: SignalSaturationBadgeProps) {
  const saturation = getSaturationLevel(inputs);
  if (!saturation) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-border px-3 py-1 text-sm text-muted-foreground">
          {labels.saturationUnknown ?? "—"}
        </span>
        {upcoming ? (
          <span className="rounded-full bg-blue-600 px-3 py-1 text-sm font-bold text-white animate-pulse">
            {labels.upcomingLaunch}
          </span>
        ) : null}
      </div>
    );
  }
  const config = SATURATION_UI[saturation];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className={`rounded-full px-3 py-1 text-sm font-bold ${config.cls}`}>
        {labels[config.labelKey]}
      </span>
      {upcoming ? (
        <span className="rounded-full bg-blue-600 px-3 py-1 text-sm font-bold text-white animate-pulse">
          {labels.upcomingLaunch}
        </span>
      ) : null}
    </div>
  );
}
