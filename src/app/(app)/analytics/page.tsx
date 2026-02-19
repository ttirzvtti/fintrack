"use client";

import { useCallback, useEffect, useState } from "react";
import { MonthlySpendingChart } from "@/components/analytics/monthly-spending-chart";
import { CategoryBreakdownChart } from "@/components/analytics/category-breakdown-chart";
import { IncomeVsExpensesChart } from "@/components/analytics/income-vs-expenses-chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

type AnalyticsData = {
  monthlySpending: { month: string; label: string; amount: number }[];
  categoryBreakdown: { name: string; icon: string; amount: number }[];
  incomeVsExpenses: {
    month: string;
    label: string;
    income: number;
    expenses: number;
  }[];
  currencies: string[];
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState<string>("");

  const fetchData = useCallback(
    (cur?: string) => {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("months", "6");
      const activeCurrency = cur ?? currency;
      if (activeCurrency) params.set("currency", activeCurrency);

      fetch(`/api/analytics?${params}`)
        .then((res) => res.json())
        .then((result) => {
          setData(result);
          // Auto-select first currency if not set
          if (!activeCurrency && result.currencies?.length > 0) {
            setCurrency(result.currencies[0]);
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    },
    [currency]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleCurrencyChange(value: string) {
    setCurrency(value);
    fetchData(value);
  }

  const activeCurrency = currency || data?.currencies?.[0] || "RON";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Analytics</h1>
        {data && data.currencies.length > 1 && (
          <Select value={activeCurrency} onValueChange={handleCurrencyChange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {data.currencies.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {loading ? (
        <div className="space-y-6">
          <Skeleton className="h-[370px] w-full rounded-lg" />
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-[370px] w-full rounded-lg" />
            <Skeleton className="h-[370px] w-full rounded-lg" />
          </div>
        </div>
      ) : data ? (
        <div className="space-y-6">
          <IncomeVsExpensesChart
            data={data.incomeVsExpenses}
            currency={activeCurrency}
          />
          <div className="grid gap-6 lg:grid-cols-2">
            <MonthlySpendingChart
              data={data.monthlySpending}
              currency={activeCurrency}
            />
            <CategoryBreakdownChart
              data={data.categoryBreakdown}
              currency={activeCurrency}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
