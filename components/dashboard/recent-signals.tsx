import { SignalTableSaturation } from "@/components/admin/signal-table-saturation";
import type { DashboardRecentSignal } from "@/lib/dashboard/stats";

type RecentSignalsProps = {
  rows: Array<DashboardRecentSignal & { relative: string }>;
  labels: {
    hot: string;
    moderate: string;
    saturated: string;
    upcomingLaunch: string;
  };
};

export function RecentSignals({ rows, labels }: RecentSignalsProps) {
  return (
    <ul className="h-full divide-y divide-[#00C2CB]/10 overflow-y-auto">
      {rows.map((row) => (
        <li
          key={row.id}
          className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] items-center gap-4 rounded-lg px-2 py-2.5 transition-colors hover:bg-[#00C2CB]/8"
        >
          <p className="truncate text-sm font-medium text-[#F5F7FA]">{row.name}</p>
          <p className="text-xs text-[#8BA3B8]">{row.source}</p>
          <SignalTableSaturation level={row.saturation} labels={labels} />
          <span className="text-xs tabular-nums text-[#8BA3B8]">{row.relative}</span>
        </li>
      ))}
    </ul>
  );
}
