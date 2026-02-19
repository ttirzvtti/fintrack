"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Wallet, ArrowLeftRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedCurrency, AnimatedInteger } from "@/components/ui/animated-number";
import type { DashboardSummary } from "@/types";

export function SummaryCards({
  period = "this-month",
  periodLabel = "This month",
}: {
  period?: string;
  periodLabel?: string;
}) {
  const [summaries, setSummaries] = useState<DashboardSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/dashboard?period=${period}`)
      .then((res) => res.json())
      .then((data) => {
        setSummaries(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [period]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-32 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {summaries.map((summary) => (
        <div key={summary.currency}>
          {summaries.length > 1 && (
            <h3 className="mb-3 text-sm font-medium text-muted-foreground">
              {summary.currency} Accounts
            </h3>
          )}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Income
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-500">
                  <AnimatedCurrency value={summary.totalIncome} currency={summary.currency} />
                </div>
                <p className="text-xs text-muted-foreground">{periodLabel}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Expenses
                </CardTitle>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">
                  <AnimatedCurrency value={summary.totalExpenses} currency={summary.currency} />
                </div>
                <p className="text-xs text-muted-foreground">{periodLabel}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Balance</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <AnimatedCurrency value={summary.balance} currency={summary.currency} />
                </div>
                <p className="text-xs text-muted-foreground">{periodLabel}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Transactions
                </CardTitle>
                <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <AnimatedInteger value={summary.transactionCount} />
                </div>
                <p className="text-xs text-muted-foreground">{periodLabel}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      ))}
    </div>
  );
}
