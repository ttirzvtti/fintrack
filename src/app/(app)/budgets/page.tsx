"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { BudgetForm } from "@/components/budgets/budget-form";

type BudgetWithSpending = {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string | null;
  monthlyLimit: number;
  spent: number;
  month: number;
  year: number;
};

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function BudgetsPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [budgets, setBudgets] = useState<BudgetWithSpending[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBudgets = useCallback(() => {
    setLoading(true);
    fetch(`/api/budgets?month=${month}&year=${year}`)
      .then((r) => r.json())
      .then((data) => {
        setBudgets(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [month, year]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  function prevMonth() {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  }

  function nextMonth() {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  }

  async function deleteBudget(id: string) {
    const res = await fetch(`/api/budgets/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Budget deleted");
      fetchBudgets();
    } else {
      toast.error("Failed to delete budget");
    }
  }

  const totalBudget = budgets.reduce((sum, b) => sum + b.monthlyLimit, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const overBudgetCount = budgets.filter((b) => b.spent > b.monthlyLimit).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Budgets</h1>
        <BudgetForm month={month} year={year} onSuccess={fetchBudgets}>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Budget
          </Button>
        </BudgetForm>
      </div>

      {/* Month selector */}
      <div className="flex items-center justify-center gap-4">
        <Button variant="outline" size="icon" onClick={prevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-lg font-medium w-48 text-center">
          {monthNames[month - 1]} {year}
        </span>
        <Button variant="outline" size="icon" onClick={nextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-lg font-medium mb-2">No budgets set</p>
            <p className="text-sm text-muted-foreground mb-4">
              Set spending limits per category to track your budget.
            </p>
            <BudgetForm month={month} year={year} onSuccess={fetchBudgets}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Set Your First Budget
              </Button>
            </BudgetForm>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Budget
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{totalBudget.toLocaleString()} RON</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Spent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${totalSpent > totalBudget ? "text-red-500" : ""}`}>
                  {totalSpent.toLocaleString()} RON
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Remaining
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${totalBudget - totalSpent < 0 ? "text-red-500" : "text-emerald-500"}`}>
                  {(totalBudget - totalSpent).toLocaleString()} RON
                </p>
              </CardContent>
            </Card>
          </div>

          {overBudgetCount > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">
                {overBudgetCount} {overBudgetCount === 1 ? "category is" : "categories are"} over budget!
              </span>
            </div>
          )}

          {/* Budget items */}
          <div className="space-y-4">
            {budgets.map((budget) => {
              const percentage = budget.monthlyLimit > 0
                ? Math.min((budget.spent / budget.monthlyLimit) * 100, 100)
                : 0;
              const isOver = budget.spent > budget.monthlyLimit;
              const isWarning = percentage >= 80 && !isOver;

              return (
                <Card key={budget.id} className={isOver ? "border-red-300 dark:border-red-800" : ""}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{budget.categoryIcon}</span>
                        <span className="font-medium">{budget.categoryName}</span>
                        {isOver && (
                          <span className="text-xs font-medium text-red-500 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Over budget!
                          </span>
                        )}
                        {isWarning && (
                          <span className="text-xs font-medium text-amber-500">
                            Almost there
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">
                          <span className={isOver ? "text-red-500 font-medium" : "font-medium"}>
                            {budget.spent.toLocaleString()}
                          </span>
                          {" / "}
                          {budget.monthlyLimit.toLocaleString()} RON
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => deleteBudget(budget.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <Progress
                      value={percentage}
                      className={`h-3 ${
                        isOver
                          ? "[&>div]:bg-red-500"
                          : isWarning
                            ? "[&>div]:bg-amber-500"
                            : "[&>div]:bg-emerald-500"
                      }`}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {isOver
                        ? `${(budget.spent - budget.monthlyLimit).toLocaleString()} RON over`
                        : `${(budget.monthlyLimit - budget.spent).toLocaleString()} RON remaining`}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
