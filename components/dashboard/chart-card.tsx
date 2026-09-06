import { cn } from "@/lib/utils";

type ChartCardProps = {
  title: string;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  empty?: boolean;
  emptyLabel: string;
};

export function ChartCard({
  title,
  children,
  className,
  bodyClassName,
  empty,
  emptyLabel,
}: ChartCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[#00C2CB]/20 bg-[#16304D] p-5",
        "shadow-[0_0_24px_rgba(0,194,203,0.08)]",
        className,
      )}
    >
      <h2 className="text-sm font-semibold tracking-tight text-[#D4AF37]">{title}</h2>
      <div className={cn("mt-4 h-[280px]", bodyClassName)}>
        {empty ? (
          <div className="flex h-full items-center justify-center text-sm text-[#8BA3B8]">
            {emptyLabel}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
