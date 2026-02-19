"use client";

import { useCallback, useEffect, useState } from "react";
import { format, differenceInDays } from "date-fns";
import { Plus, Trash2, TrendingUp, ArrowDownToLine, Target } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/currency";
import { GoalForm } from "@/components/goals/goal-form";
import { DepositDialog } from "@/components/goals/deposit-dialog";

type SavingsGoal = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  deadline: string | null;
  createdAt: string;
};

export default function GoalsPage() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGoals = useCallback(() => {
    setLoading(true);
    fetch("/api/goals")
      .then((r) => r.json())
      .then((data) => {
        setGoals(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  async function deleteGoal(id: string) {
    const res = await fetch(`/api/goals/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Goal deleted");
      fetchGoals();
    } else {
      toast.error("Failed to delete goal");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Savings Goals</h1>
        <GoalForm onSuccess={fetchGoals}>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Goal
          </Button>
        </GoalForm>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-52 w-full rounded-lg" />
          ))}
        </div>
      ) : goals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No savings goals yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Set a goal to start saving for something special.
            </p>
            <GoalForm onSuccess={fetchGoals}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Goal
              </Button>
            </GoalForm>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {goals.map((goal) => {
            const percentage = goal.targetAmount > 0
              ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
              : 0;
            const isComplete = goal.currentAmount >= goal.targetAmount;
            const daysLeft = goal.deadline
              ? differenceInDays(new Date(goal.deadline), new Date())
              : null;

            return (
              <Card key={goal.id} className={isComplete ? "border-emerald-300 dark:border-emerald-800" : ""}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-base font-medium">
                      {goal.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      {isComplete && (
                        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                          Completed!
                        </Badge>
                      )}
                      {goal.deadline && (
                        <span className="text-xs text-muted-foreground">
                          {daysLeft !== null && daysLeft > 0
                            ? `${daysLeft} days left`
                            : daysLeft === 0
                              ? "Due today"
                              : daysLeft !== null
                                ? "Overdue"
                                : ""}{" "}
                          — {format(new Date(goal.deadline), "MMM d, yyyy")}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => deleteGoal(goal.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="text-2xl font-bold">
                        {formatCurrency(goal.currentAmount, goal.currency)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        of {formatCurrency(goal.targetAmount, goal.currency)}
                      </span>
                    </div>
                    <Progress
                      value={percentage}
                      className={`h-3 ${
                        isComplete
                          ? "[&>div]:bg-emerald-500"
                          : "[&>div]:bg-primary"
                      }`}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {percentage.toFixed(0)}% reached
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <DepositDialog
                      goalId={goal.id}
                      goalName={goal.name}
                      operation="deposit"
                      onSuccess={fetchGoals}
                    >
                      <Button size="sm" className="flex-1">
                        <TrendingUp className="mr-2 h-3.5 w-3.5" />
                        Add Money
                      </Button>
                    </DepositDialog>
                    <DepositDialog
                      goalId={goal.id}
                      goalName={goal.name}
                      operation="withdraw"
                      onSuccess={fetchGoals}
                    >
                      <Button variant="outline" size="sm" className="flex-1">
                        <ArrowDownToLine className="mr-2 h-3.5 w-3.5" />
                        Withdraw
                      </Button>
                    </DepositDialog>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
