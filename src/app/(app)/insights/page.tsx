"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  TrendingUp,
  TrendingDown,
  Info,
  BrainCircuit,
  Repeat,
  BarChart3,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/currency";

type Forecast = {
  avgMonthlyExpenses: number;
  avgMonthlyIncome: number;
  currentMonthExpenses: number;
  currentMonthIncome: number;
  projectedExpenses: number;
  currency: string;
};

type RecurringItem = {
  description: string;
  amount: number;
  occurrences: number;
  lastDate: string;
  currency: string;
};

type Insight = {
  type: "up" | "down" | "info";
  message: string;
};

type TrendItem = {
  month: string;
  label: string;
  expenses: number;
  income: number;
};

type InsightsData = {
  forecast: Forecast | null;
  recurring: RecurringItem[];
  insights: Insight[];
  trend: TrendItem[];
};

export default function InsightsPage() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/insights")
      .then((r) => r.json())
      .then((result) => {
        setData(result);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Insights</h1>
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { forecast, recurring, insights, trend } = data;
  const currency = forecast?.currency || "RON";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold">Insights</h1>
        <BrainCircuit className="h-7 w-7 text-muted-foreground" />
      </div>

      {/* Forecast card */}
      {forecast && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Monthly Forecast
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">Current month expenses</p>
                <p className="text-xl font-bold text-red-500">
                  {formatCurrency(forecast.currentMonthExpenses, currency)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Projected end-of-month</p>
                <p className="text-xl font-bold text-amber-500">
                  {formatCurrency(forecast.projectedExpenses, currency)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">3-month average expenses</p>
                <p className="text-xl font-bold">
                  {formatCurrency(forecast.avgMonthlyExpenses, currency)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">3-month average income</p>
                <p className="text-xl font-bold text-emerald-500">
                  {formatCurrency(forecast.avgMonthlyIncome, currency)}
                </p>
              </div>
            </div>
            {forecast.projectedExpenses > forecast.avgMonthlyExpenses * 1.1 && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm">
                  You&apos;re on track to spend{" "}
                  {Math.round(((forecast.projectedExpenses - forecast.avgMonthlyExpenses) / forecast.avgMonthlyExpenses) * 100)}% more
                  than your average this month.
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Spending Trend */}
      {trend.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>6-Month Spending Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="label"
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number | string | undefined, name: string | undefined) => [
                    `${Number(value ?? 0).toLocaleString()} ${currency}`,
                    name === "income" ? "Income" : "Expenses",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="hsl(142, 71%, 45%)"
                  fill="url(#incomeGradient)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stroke="hsl(0, 72%, 51%)"
                  fill="url(#expenseGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Smart Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BrainCircuit className="h-5 w-5" />
              Smart Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            {insights.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Add more transactions to unlock insights.
              </p>
            ) : (
              <div className="space-y-3">
                {insights.map((insight, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-lg border p-3"
                  >
                    {insight.type === "up" ? (
                      <TrendingUp className="h-4 w-4 mt-0.5 text-red-500 shrink-0" />
                    ) : insight.type === "down" ? (
                      <TrendingDown className="h-4 w-4 mt-0.5 text-emerald-500 shrink-0" />
                    ) : (
                      <Info className="h-4 w-4 mt-0.5 text-blue-500 shrink-0" />
                    )}
                    <span className="text-sm">{insight.message}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recurring Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Repeat className="h-5 w-5" />
              Recurring Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recurring.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No recurring transactions detected yet.
              </p>
            ) : (
              <div className="space-y-3">
                {recurring.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{item.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.occurrences}x — last on{" "}
                        {format(new Date(item.lastDate), "MMM d, yyyy")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-red-500">
                        {formatCurrency(item.amount, item.currency)}
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        {formatCurrency(item.amount * item.occurrences, item.currency)} total
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
