"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { formatMoeda } from "@/lib/formatters";

interface ChartDataPoint {
  mes: string;
  receitas: number;
  despesas: number;
}

export function EvolucaoFinanceiraChart({ data }: { data: ChartDataPoint[] }) {
  return (
    <div className="h-72 w-full pt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis dataKey="mes" tickLine={false} tick={{ fontSize: 12 }} />
          <YAxis
            tickLine={false}
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            formatter={(val: any) => [formatMoeda(val), ""]}
            contentStyle={{
              borderRadius: "8px",
              backgroundColor: "var(--background)",
              borderColor: "var(--border)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          />
          <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
          <Bar dataKey="receitas" name="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="despesas" name="Despesas" fill="#f43f5e" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
