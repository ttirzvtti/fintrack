import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accounts = await db.account.findMany({
    where: { userId: session.user.id },
    select: { id: true, currency: true },
  });

  if (accounts.length === 0) {
    return NextResponse.json({
      forecast: null,
      recurring: [],
      insights: [],
      trend: [],
    });
  }

  const accountIds = accounts.map((a) => a.id);
  const primaryCurrency = accounts[0].currency;

  // Get last 6 months of transactions
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const transactions = await db.transaction.findMany({
    where: {
      accountId: { in: accountIds },
      date: { gte: sixMonthsAgo },
    },
    include: { category: true, account: true },
    orderBy: { date: "desc" },
  });

  // ── 1. MONTHLY SPENDING TREND (for forecast) ──
  const monthlyExpenses: Record<string, number> = {};
  const monthlyIncome: Record<string, number> = {};

  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyExpenses[key] = 0;
    monthlyIncome[key] = 0;
  }

  for (const t of transactions) {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (key in monthlyExpenses) {
      if (t.type === "EXPENSE") {
        monthlyExpenses[key] += Number(t.amount);
      } else {
        monthlyIncome[key] += Number(t.amount);
      }
    }
  }

  // Build trend data
  const trend = Object.keys(monthlyExpenses)
    .sort()
    .map((key) => {
      const [y, m] = key.split("-");
      const date = new Date(parseInt(y), parseInt(m) - 1);
      return {
        month: key,
        label: date.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        expenses: Math.round(monthlyExpenses[key] * 100) / 100,
        income: Math.round(monthlyIncome[key] * 100) / 100,
      };
    });

  // ── 2. FORECAST: simple moving average of last 3 months expenses ──
  const sortedMonths = Object.keys(monthlyExpenses).sort();
  // Exclude current month (incomplete) for forecasting
  const completedMonths = sortedMonths.slice(0, -1);
  const lastThreeExpenses = completedMonths.slice(-3).map((k) => monthlyExpenses[k]);
  const avgExpense = lastThreeExpenses.length > 0
    ? lastThreeExpenses.reduce((a, b) => a + b, 0) / lastThreeExpenses.length
    : 0;

  const lastThreeIncome = completedMonths.slice(-3).map((k) => monthlyIncome[k]);
  const avgIncome = lastThreeIncome.length > 0
    ? lastThreeIncome.reduce((a, b) => a + b, 0) / lastThreeIncome.length
    : 0;

  const currentMonthKey = sortedMonths[sortedMonths.length - 1];
  const currentExpenses = monthlyExpenses[currentMonthKey] || 0;
  const currentIncome = monthlyIncome[currentMonthKey] || 0;
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dayOfMonth = now.getDate();
  const projectedExpenses = dayOfMonth > 0
    ? Math.round((currentExpenses / dayOfMonth) * daysInMonth * 100) / 100
    : 0;

  const forecast = {
    avgMonthlyExpenses: Math.round(avgExpense * 100) / 100,
    avgMonthlyIncome: Math.round(avgIncome * 100) / 100,
    currentMonthExpenses: Math.round(currentExpenses * 100) / 100,
    currentMonthIncome: Math.round(currentIncome * 100) / 100,
    projectedExpenses,
    currency: primaryCurrency,
  };

  // ── 3. RECURRING DETECTION ──
  // Find transactions with similar description + similar amount appearing multiple times
  const descAmountMap = new Map<string, { count: number; amount: number; description: string; lastDate: Date }>();

  for (const t of transactions) {
    if (t.type !== "EXPENSE" || !t.description) continue;
    // Normalize description
    const normalized = t.description.toLowerCase().trim();
    const amount = Math.round(Number(t.amount) * 100) / 100;
    const key = `${normalized}|${amount}`;

    const existing = descAmountMap.get(key);
    if (existing) {
      existing.count++;
      if (new Date(t.date) > existing.lastDate) {
        existing.lastDate = new Date(t.date);
      }
    } else {
      descAmountMap.set(key, {
        count: 1,
        amount,
        description: t.description,
        lastDate: new Date(t.date),
      });
    }
  }

  const recurring = Array.from(descAmountMap.values())
    .filter((r) => r.count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map((r) => ({
      description: r.description,
      amount: r.amount,
      occurrences: r.count,
      lastDate: r.lastDate.toISOString(),
      currency: primaryCurrency,
    }));

  // ── 4. SMART INSIGHTS ──
  const insights: { type: "up" | "down" | "info"; message: string }[] = [];

  // Compare current month vs last month per category
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const lastMonthDate = new Date(currentYear, currentMonth - 2, 1);

  const categoryThisMonth: Record<string, { name: string; icon: string; amount: number }> = {};
  const categoryLastMonth: Record<string, { name: string; icon: string; amount: number }> = {};

  for (const t of transactions) {
    if (t.type !== "EXPENSE") continue;
    const d = new Date(t.date);
    const tMonth = d.getMonth() + 1;
    const tYear = d.getFullYear();

    if (tMonth === currentMonth && tYear === currentYear) {
      if (!categoryThisMonth[t.categoryId]) {
        categoryThisMonth[t.categoryId] = { name: t.category.name, icon: t.category.icon || "", amount: 0 };
      }
      categoryThisMonth[t.categoryId].amount += Number(t.amount);
    }

    const lm = lastMonthDate;
    if (tMonth === lm.getMonth() + 1 && tYear === lm.getFullYear()) {
      if (!categoryLastMonth[t.categoryId]) {
        categoryLastMonth[t.categoryId] = { name: t.category.name, icon: t.category.icon || "", amount: 0 };
      }
      categoryLastMonth[t.categoryId].amount += Number(t.amount);
    }
  }

  for (const [catId, current] of Object.entries(categoryThisMonth)) {
    const last = categoryLastMonth[catId];
    if (last && last.amount > 0) {
      const change = ((current.amount - last.amount) / last.amount) * 100;
      if (change > 20) {
        insights.push({
          type: "up",
          message: `${current.icon} ${current.name}: spending up ${Math.round(change)}% vs last month (${Math.round(current.amount)} vs ${Math.round(last.amount)} ${primaryCurrency})`,
        });
      } else if (change < -20) {
        insights.push({
          type: "down",
          message: `${current.icon} ${current.name}: spending down ${Math.round(Math.abs(change))}% vs last month (${Math.round(current.amount)} vs ${Math.round(last.amount)} ${primaryCurrency})`,
        });
      }
    }
  }

  // Top spending category this month
  const topCategory = Object.values(categoryThisMonth).sort((a, b) => b.amount - a.amount)[0];
  if (topCategory) {
    insights.push({
      type: "info",
      message: `${topCategory.icon} ${topCategory.name} is your top spending category this month (${Math.round(topCategory.amount)} ${primaryCurrency})`,
    });
  }

  // Savings rate
  if (currentIncome > 0) {
    const savingsRate = ((currentIncome - currentExpenses) / currentIncome) * 100;
    if (savingsRate > 0) {
      insights.push({
        type: "info",
        message: `Your savings rate this month is ${Math.round(savingsRate)}%`,
      });
    } else {
      insights.push({
        type: "up",
        message: `You're spending more than you earn this month — expenses exceed income by ${Math.round(Math.abs(currentIncome - currentExpenses))} ${primaryCurrency}`,
      });
    }
  }

  return NextResponse.json({ forecast, recurring, insights, trend });
}
