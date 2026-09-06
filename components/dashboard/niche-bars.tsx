"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DashboardBar } from "@/lib/dashboard/stats";

type NicheBarsProps = {
  data: DashboardBar[];
};

export function NicheBars({ data }: NicheBarsProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 8, right: 12, left: 8, bottom: 0 }}
      >
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="label"
          width={88}
          tick={{ fill: "#8BA3B8", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            background: "#12263F",
            border: "1px solid rgba(212,175,55,0.3)",
            borderRadius: 8,
            color: "#F5F7FA",
          }}
        />
        <Bar dataKey="count" fill="#D4AF37" radius={[0, 6, 6, 0]} barSize={14} />
      </BarChart>
    </ResponsiveContainer>
  );
}
