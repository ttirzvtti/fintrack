"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type CategoryData = {
  name: string;
  icon: string;
  amount: number;
};

const COLORS = [
  "hsl(0, 72%, 51%)",
  "hsl(25, 95%, 53%)",
  "hsl(45, 93%, 47%)",
  "hsl(142, 71%, 45%)",
  "hsl(199, 89%, 48%)",
  "hsl(262, 83%, 58%)",
  "hsl(330, 81%, 60%)",
  "hsl(174, 72%, 46%)",
  "hsl(215, 76%, 56%)",
  "hsl(290, 68%, 50%)",
  "hsl(12, 76%, 61%)",
];

export function CategoryBreakdownChart({
  data,
  currency,
}: {
  data: CategoryData[];
  currency: string;
}) {
  const chartData = data.map((d) => ({
    ...d,
    displayName: `${d.icon} ${d.name}`,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Category Breakdown (This Month)</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No expenses this month yet.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="amount"
                nameKey="displayName"
              >
                {chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number | string | undefined) => [
                  `${Number(value ?? 0).toLocaleString()} ${currency}`,
                ]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
