import { Link } from "@/i18n/navigation";

export const SATURATION_FILTERS = [
  "SATURATED",
  "WARNING",
  "SAFE",
  "UPCOMING",
] as const;

export type SaturationFilter = (typeof SATURATION_FILTERS)[number];

const CHIPS = [
  {
    key: "SATURATED",
    labelKey: "saturationSaturated",
    cls: "bg-red-600 text-white animate-pulse",
  },
  {
    key: "WARNING",
    labelKey: "saturationWarning",
    cls: "bg-yellow-500 text-black animate-pulse",
  },
  {
    key: "SAFE",
    labelKey: "saturationSafe",
    cls: "bg-green-600 text-white animate-pulse",
  },
  {
    key: "UPCOMING",
    labelKey: "upcomingLaunch",
    cls: "bg-blue-600 text-white animate-pulse",
  },
] as const;

type SaturationLegendProps = {
  labels: {
    saturationSaturated: string;
    saturationWarning: string;
    saturationSafe: string;
    upcomingLaunch: string;
  };
  activeKey?: SaturationFilter;
  hrefFor?: (key: SaturationFilter) => string;
};

export function SaturationLegend({ labels, activeKey, hrefFor }: SaturationLegendProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {CHIPS.map((chip) => {
        const className = `rounded-full px-3 py-1 text-sm font-bold ${chip.cls} ${
          activeKey === chip.key ? "ring-2 ring-white ring-offset-2 ring-offset-background" : ""
        }`;
        if (hrefFor) {
          return (
            <Link key={chip.key} href={hrefFor(chip.key)} className={className}>
              {labels[chip.labelKey]}
            </Link>
          );
        }
        return (
          <span key={chip.key} className={className}>
            {labels[chip.labelKey]}
          </span>
        );
      })}
    </div>
  );
}
