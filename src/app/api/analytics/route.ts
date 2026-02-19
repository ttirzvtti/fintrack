import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const months = parseInt(searchParams.get("months") || "6");
  const currency = searchParams.get("currency");

  // Get user's accounts, optionally filtered by currency
  const accounts = await db.account.findMany({
    where: {
      userId: session.user.id,
      ...(currency ? { currency } : {}),
    },
    select: { id: true, currency: true },
  });

  if (accounts.length === 0) {
    return NextResponse.json({
      monthlySpending: [],
      categoryBreakdown: [],
      incomeVsExpenses: [],
      currencies: [],
    });
  }

  const accountIds = accounts.map((a) => a.id);

  // Get all unique currencies the user has
  const allAccounts = await db.account.findMany({
    where: { userId: session.user.id },
    select: { currency: true },
  });
  const currencies = [...new Set(allAccounts.map((a) => a.currency))];

  // Date range: last N months
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);

  const transactions = await db.transaction.findMany({
    where: {
      accountId: { in: accountIds },
      date: { gte: startDate },
    },
    include: { category: true },
  });

  // 1. Monthly spending (bar chart) — expenses only, grouped by month
  const monthlyMap = new Map<string, number>();
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap.set(key, 0);
  }

  for (const t of transactions) {
    if (t.type !== "EXPENSE") continue;
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (monthlyMap.has(key)) {
      monthlyMap.set(key, (monthlyMap.get(key) || 0) + Number(t.amount));
    }
  }

  const monthlySpending = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, amount]) => {
      const [year, m] = month.split("-");
      const date = new Date(parseInt(year), parseInt(m) - 1);
      return {
        month,
        label: date.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        amount: Math.round(amount * 100) / 100,
      };
    });

  // 2. Category breakdown (pie chart) — expenses only, current month
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const categoryMap = new Map<string, { name: string; icon: string; amount: number }>();

  for (const t of transactions) {
    if (t.type !== "EXPENSE") continue;
    const d = new Date(t.date);
    if (d < currentMonthStart) continue;

    const existing = categoryMap.get(t.categoryId);
    if (existing) {
      existing.amount += Number(t.amount);
    } else {
      categoryMap.set(t.categoryId, {
        name: t.category.name,
        icon: t.category.icon || "",
        amount: Number(t.amount),
      });
    }
  }

  const categoryBreakdown = Array.from(categoryMap.values())
    .map((c) => ({ ...c, amount: Math.round(c.amount * 100) / 100 }))
    .sort((a, b) => b.amount - a.amount);

  // 3. Income vs Expenses (line chart) — grouped by month
  const incomeExpenseMap = new Map<string, { income: number; expenses: number }>();
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    incomeExpenseMap.set(key, { income: 0, expenses: 0 });
  }

  for (const t of transactions) {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const entry = incomeExpenseMap.get(key);
    if (!entry) continue;

    if (t.type === "INCOME") {
      entry.income += Number(t.amount);
    } else {
      entry.expenses += Number(t.amount);
    }
  }

  const incomeVsExpenses = Array.from(incomeExpenseMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => {
      const [year, m] = month.split("-");
      const date = new Date(parseInt(year), parseInt(m) - 1);
      return {
        month,
        label: date.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        income: Math.round(data.income * 100) / 100,
        expenses: Math.round(data.expenses * 100) / 100,
      };
    });

  return NextResponse.json({
    monthlySpending,
    categoryBreakdown,
    incomeVsExpenses,
    currencies,
  });
}
