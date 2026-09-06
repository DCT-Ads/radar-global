"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DashboardPoint } from "@/lib/dashboard/stats";

type SignalsAreaChartProps = {
  data: DashboardPoint[];
};

export function SignalsAreaChart({ data }: SignalsAreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="signalFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00C2CB" stopOpacity={0.45} />
            <stop offset="100%" stopColor="#00C2CB" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#1f3b5c" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: "#8BA3B8", fontSize: 11 }}
          tickFormatter={(value: string) => value.slice(5)}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: "#8BA3B8", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={36}
        />
        <Tooltip
          contentStyle={{
            background: "#12263F",
            border: "1px solid rgba(0,194,203,0.25)",
            borderRadius: 8,
            color: "#F5F7FA",
          }}
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke="#00C2CB"
          strokeWidth={2}
          fill="url(#signalFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
