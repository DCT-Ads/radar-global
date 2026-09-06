import { cn } from "@/lib/utils";

type KpiCardProps = {
  label: string;
  value: number;
  hint?: string;
  accent?: "gold" | "cyan" | "green" | "blue";
  deltaPct?: number | null;
  deltaLabel?: string;
  badge?: string;
  meta?: string;
  size?: "md" | "lg";
  className?: string;
};

const DOT: Record<NonNullable<KpiCardProps["accent"]>, string> = {
  gold: "bg-[#D4AF37]",
  cyan: "bg-[#00C2CB]",
  green: "bg-green-500",
  blue: "bg-blue-600",
};

const VALUE: Record<NonNullable<KpiCardProps["accent"]>, string> = {
  gold: "text-[#D4AF37]",
  cyan: "text-[#D4AF37]",
  green: "text-[#D4AF37]",
  blue: "text-blue-600",
};

export function KpiCard({
  label,
  value,
  hint,
  accent = "gold",
  deltaPct,
  deltaLabel,
  badge,
  meta,
  size = "md",
  className,
}: KpiCardProps) {
  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-xl border border-[#00C2CB]/20 bg-[#16304D] p-5",
        "shadow-[0_0_24px_rgba(212,175,55,0.08)]",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-[#8BA3B8]">
          {label}
        </p>
        <span className={cn("h-2 w-2 rounded-full", DOT[accent])} />
      </div>
      <p
        className={cn(
          "mt-3 font-semibold tracking-tight tabular-nums",
          size === "lg" ? "text-5xl" : "text-3xl",
          VALUE[accent],
        )}
      >
        {value.toLocaleString()}
      </p>
      {badge ? (
        <span className="mt-1.5 inline-flex w-fit rounded-full bg-[#00C2CB]/15 px-2.5 py-0.5 text-xs font-semibold text-[#00C2CB]">
          {badge}
        </span>
      ) : deltaPct != null && deltaLabel ? (
        <p
          className={cn(
            "mt-1.5 text-xs font-medium",
            deltaPct > 0 && "text-[#00C2CB]",
            deltaPct < 0 && "text-red-400",
            deltaPct === 0 && "text-[#8BA3B8]",
          )}
        >
          {deltaPct > 0 ? "+" : ""}
          {deltaPct}% {deltaLabel}
        </p>
      ) : null}
      {meta ? (
        <p className="mt-1 text-xs tabular-nums text-[#8BA3B8]">{meta}</p>
      ) : null}
      {hint ? <p className="mt-1 text-xs text-[#8BA3B8]">{hint}</p> : null}
    </div>
  );
}
