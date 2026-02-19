import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { DashboardSummary } from "@/types";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || "this-month";

  const now = new Date();
  let startOfMonth: Date;
  let endOfMonth: Date;

  if (period === "last-month") {
    startOfMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    endOfMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  } else if (period === "this-year") {
    startOfMonth = new Date(now.getFullYear(), 0, 1);
    endOfMonth = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
  } else {
    // this-month (default)
    startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  const accounts = await db.account.findMany({
    where: { userId: session.user.id },
    select: { id: true, currency: true },
  });

  if (accounts.length === 0) {
    const summary: DashboardSummary[] = [
      {
        totalIncome: 0,
        totalExpenses: 0,
        balance: 0,
        transactionCount: 0,
        currency: "RON",
      },
    ];
    return NextResponse.json(summary);
  }

  // Group accounts by currency
  const currencyGroups: Record<string, string[]> = {};
  for (const account of accounts) {
    if (!currencyGroups[account.currency]) {
      currencyGroups[account.currency] = [];
    }
    currencyGroups[account.currency].push(account.id);
  }

  const summaries: DashboardSummary[] = [];

  for (const [currency, accountIds] of Object.entries(currencyGroups)) {
    const transactions = await db.transaction.findMany({
      where: {
        accountId: { in: accountIds },
        date: { gte: startOfMonth, lte: endOfMonth },
      },
    });

    let totalIncome = 0;
    let totalExpenses = 0;

    for (const t of transactions) {
      const amount = Number(t.amount);
      if (t.type === "INCOME") {
        totalIncome += amount;
      } else {
        totalExpenses += amount;
      }
    }

    summaries.push({
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      transactionCount: transactions.length,
      currency,
    });
  }

  return NextResponse.json(summaries);
}
