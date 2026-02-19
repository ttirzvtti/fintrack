import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const budgetSchema = z.object({
  categoryId: z.string().min(1),
  monthlyLimit: z.coerce.number().positive("Limit must be positive"),
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2020).max(2100),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));
  const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));

  // Get budgets for this month
  const budgets = await db.budget.findMany({
    where: { userId: session.user.id, month, year },
    include: { category: true },
    orderBy: { createdAt: "asc" },
  });

  // Get user's account IDs
  const accounts = await db.account.findMany({
    where: { userId: session.user.id },
    select: { id: true },
  });
  const accountIds = accounts.map((a) => a.id);

  // Get spending per category for this month
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

  const transactions = accountIds.length > 0
    ? await db.transaction.findMany({
        where: {
          accountId: { in: accountIds },
          type: "EXPENSE",
          date: { gte: startOfMonth, lte: endOfMonth },
        },
      })
    : [];

  // Sum spending per category
  const spendingByCategory: Record<string, number> = {};
  for (const t of transactions) {
    spendingByCategory[t.categoryId] = (spendingByCategory[t.categoryId] || 0) + Number(t.amount);
  }

  // Combine budgets with actual spending
  const result = budgets.map((b) => ({
    id: b.id,
    categoryId: b.categoryId,
    categoryName: b.category.name,
    categoryIcon: b.category.icon,
    monthlyLimit: Number(b.monthlyLimit),
    spent: Math.round((spendingByCategory[b.categoryId] || 0) * 100) / 100,
    month: b.month,
    year: b.year,
  }));

  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = budgetSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  // Check if budget already exists for this category/month/year
  const existing = await db.budget.findFirst({
    where: {
      userId: session.user.id,
      categoryId: parsed.data.categoryId,
      month: parsed.data.month,
      year: parsed.data.year,
    },
  });

  if (existing) {
    // Update existing budget
    const budget = await db.budget.update({
      where: { id: existing.id },
      data: { monthlyLimit: parsed.data.monthlyLimit },
    });
    return NextResponse.json(budget);
  }

  const budget = await db.budget.create({
    data: {
      userId: session.user.id,
      categoryId: parsed.data.categoryId,
      monthlyLimit: parsed.data.monthlyLimit,
      month: parsed.data.month,
      year: parsed.data.year,
    },
  });

  return NextResponse.json(budget, { status: 201 });
}
