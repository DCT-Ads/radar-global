"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { DashboardSaturation } from "@/lib/dashboard/stats";

const COLORS: Record<string, string> = {
  SATURATED: "#dc2626",
  WARNING: "#eab308",
  SAFE: "#22c55e",
};

const MIN_VISIBLE_SHARE = 0.035;

type SaturationDonutProps = {
  data: DashboardSaturation[];
  labels: Record<string, string>;
};

type Slice = {
  level: string;
  name: string;
  count: number;
  display: number;
  percent: number;
};

function SaturationTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: Slice }>;
}) {
  if (!active || !payload?.[0]) {
    return null;
  }
  const item = payload[0].payload;
  return (
    <div className="rounded-lg border border-[#00C2CB]/30 bg-[#12263F] px-3 py-2 text-sm text-[#F5F7FA] shadow-lg">
      <p className="font-medium">{item.name}</p>
      <p className="mt-0.5 tabular-nums text-[#8BA3B8]">
        {item.count.toLocaleString()} · {item.percent.toFixed(1)}%
      </p>
    </div>
  );
}

export function SaturationDonut({ data, labels }: SaturationDonutProps) {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  const chartData: Slice[] = data.map((item) => {
    const percent = total > 0 ? (item.count / total) * 100 : 0;
    const floor = Math.max(1, Math.ceil(total * MIN_VISIBLE_SHARE));
    return {
      level: item.level,
      name: labels[item.level] ?? item.level,
      count: item.count,
      display: item.count === 0 ? 0 : Math.max(item.count, floor),
      percent,
    };
  });

  return (
    <div className="flex h-full flex-col">
      <ResponsiveContainer width="100%" height="72%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="display"
            nameKey="name"
            innerRadius={58}
            outerRadius={88}
            paddingAngle={1}
            stroke="#16304D"
            strokeWidth={1}
          >
            {chartData.map((item) => (
              <Cell key={item.level} fill={COLORS[item.level]} />
            ))}
          </Pie>
          <Tooltip content={<SaturationTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <ul className="mt-2 space-y-1 text-xs text-[#8BA3B8]">
        {chartData.map((item) => (
          <li key={item.level} className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: COLORS[item.level] }}
              />
              {item.name}
            </span>
            <span className="tabular-nums text-[#F5F7FA]">
              {item.count.toLocaleString()} · {item.percent.toFixed(1)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
