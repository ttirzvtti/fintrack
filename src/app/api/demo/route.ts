import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

const DEMO_EMAIL = "demo@fintrack.app";
const DEMO_PASSWORD = "demo123456";

export async function GET() {
  // Check if demo user exists
  let user = await db.user.findUnique({ where: { email: DEMO_EMAIL } });

  if (!user) {
    // Create demo user
    const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);
    user = await db.user.create({
      data: {
        name: "Demo User",
        email: DEMO_EMAIL,
        password: hashedPassword,
      },
    });

    // Create demo accounts
    const ronAccount = await db.account.create({
      data: { name: "Main Account", type: "CHECKING", currency: "RON", userId: user.id },
    });

    const eurAccount = await db.account.create({
      data: { name: "EUR Savings", type: "SAVINGS", currency: "EUR", userId: user.id },
    });

    // Get categories
    const categories = await db.category.findMany({ where: { isDefault: true } });
    const catMap: Record<string, string> = {};
    for (const c of categories) {
      catMap[c.name] = c.id;
    }

    // Generate 3 months of realistic transactions
    const now = new Date();

    const demoTransactions = [
      // Current month
      { amount: 5500, type: "INCOME", desc: "Salary February", cat: "Salary", daysAgo: 1, account: ronAccount.id },
      { amount: 2100, type: "EXPENSE", desc: "Rent Payment", cat: "Rent", daysAgo: 2, account: ronAccount.id },
      { amount: 127.50, type: "EXPENSE", desc: "Lidl Grocery Shopping", cat: "Food", daysAgo: 3, account: ronAccount.id },
      { amount: 49.99, type: "EXPENSE", desc: "Netflix Subscription", cat: "Entertainment", daysAgo: 4, account: ronAccount.id },
      { amount: 250, type: "EXPENSE", desc: "OMV Fuel", cat: "Transport", daysAgo: 5, account: ronAccount.id },
      { amount: 55, type: "EXPENSE", desc: "Digi Internet Bill", cat: "Utilities", daysAgo: 6, account: ronAccount.id },
      { amount: 189.99, type: "EXPENSE", desc: "Emag Headphones", cat: "Shopping", daysAgo: 7, account: ronAccount.id },
      { amount: 1200, type: "INCOME", desc: "Freelance Project", cat: "Freelance", daysAgo: 8, account: ronAccount.id },
      { amount: 78.50, type: "EXPENSE", desc: "Catena Pharmacy", cat: "Health", daysAgo: 9, account: ronAccount.id },
      { amount: 45.80, type: "EXPENSE", desc: "Mega Image Food", cat: "Food", daysAgo: 10, account: ronAccount.id },
      { amount: 23.40, type: "EXPENSE", desc: "Uber Ride", cat: "Transport", daysAgo: 11, account: ronAccount.id },
      { amount: 26.99, type: "EXPENSE", desc: "Spotify Premium", cat: "Entertainment", daysAgo: 12, account: ronAccount.id },
      { amount: 62, type: "EXPENSE", desc: "Glovo Food Delivery", cat: "Food", daysAgo: 13, account: ronAccount.id },
      { amount: 210.30, type: "EXPENSE", desc: "Kaufland Weekly Groceries", cat: "Food", daysAgo: 14, account: ronAccount.id },
      // Last month
      { amount: 5500, type: "INCOME", desc: "Salary January", cat: "Salary", daysAgo: 32, account: ronAccount.id },
      { amount: 2100, type: "EXPENSE", desc: "Rent Payment", cat: "Rent", daysAgo: 33, account: ronAccount.id },
      { amount: 350, type: "EXPENSE", desc: "Kaufland Groceries", cat: "Food", daysAgo: 35, account: ronAccount.id },
      { amount: 49.99, type: "EXPENSE", desc: "Netflix Subscription", cat: "Entertainment", daysAgo: 36, account: ronAccount.id },
      { amount: 180, type: "EXPENSE", desc: "Engie Gas Bill", cat: "Utilities", daysAgo: 37, account: ronAccount.id },
      { amount: 300, type: "EXPENSE", desc: "OMV Fuel", cat: "Transport", daysAgo: 38, account: ronAccount.id },
      { amount: 55, type: "EXPENSE", desc: "Digi Internet Bill", cat: "Utilities", daysAgo: 39, account: ronAccount.id },
      { amount: 150, type: "EXPENSE", desc: "Zara Clothes", cat: "Shopping", daysAgo: 40, account: ronAccount.id },
      { amount: 89, type: "EXPENSE", desc: "Doctor Visit", cat: "Health", daysAgo: 42, account: ronAccount.id },
      { amount: 800, type: "INCOME", desc: "Freelance Bonus", cat: "Freelance", daysAgo: 45, account: ronAccount.id },
      { amount: 26.99, type: "EXPENSE", desc: "Spotify Premium", cat: "Entertainment", daysAgo: 46, account: ronAccount.id },
      { amount: 165, type: "EXPENSE", desc: "Lidl + Profi Groceries", cat: "Food", daysAgo: 48, account: ronAccount.id },
      // Two months ago
      { amount: 5500, type: "INCOME", desc: "Salary December", cat: "Salary", daysAgo: 62, account: ronAccount.id },
      { amount: 2100, type: "EXPENSE", desc: "Rent Payment", cat: "Rent", daysAgo: 63, account: ronAccount.id },
      { amount: 420, type: "EXPENSE", desc: "Kaufland Groceries", cat: "Food", daysAgo: 65, account: ronAccount.id },
      { amount: 49.99, type: "EXPENSE", desc: "Netflix Subscription", cat: "Entertainment", daysAgo: 67, account: ronAccount.id },
      { amount: 200, type: "EXPENSE", desc: "OMV Fuel", cat: "Transport", daysAgo: 68, account: ronAccount.id },
      { amount: 235, type: "EXPENSE", desc: "Engie + Enel Bills", cat: "Utilities", daysAgo: 69, account: ronAccount.id },
      { amount: 450, type: "EXPENSE", desc: "Decathlon Winter Jacket", cat: "Shopping", daysAgo: 72, account: ronAccount.id },
      { amount: 26.99, type: "EXPENSE", desc: "Spotify Premium", cat: "Entertainment", daysAgo: 75, account: ronAccount.id },
      { amount: 130, type: "EXPENSE", desc: "Mega Image + Lidl", cat: "Food", daysAgo: 78, account: ronAccount.id },
      // EUR account
      { amount: 500, type: "INCOME", desc: "EUR Transfer", cat: "Freelance", daysAgo: 5, account: eurAccount.id },
      { amount: 50, type: "EXPENSE", desc: "Amazon Purchase", cat: "Shopping", daysAgo: 10, account: eurAccount.id },
    ];

    for (const t of demoTransactions) {
      const date = new Date(now);
      date.setDate(date.getDate() - t.daysAgo);
      await db.transaction.create({
        data: {
          amount: t.amount,
          type: t.type as "INCOME" | "EXPENSE",
          description: t.desc,
          date,
          accountId: t.account,
          categoryId: catMap[t.cat] || catMap["Other"] || categories[0].id,
        },
      });
    }

    // Create demo budgets (current month)
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const demoBudgets = [
      { cat: "Food", limit: 800 },
      { cat: "Transport", limit: 400 },
      { cat: "Entertainment", limit: 150 },
      { cat: "Utilities", limit: 300 },
      { cat: "Shopping", limit: 300 },
    ];

    for (const b of demoBudgets) {
      if (catMap[b.cat]) {
        await db.budget.create({
          data: {
            userId: user.id,
            categoryId: catMap[b.cat],
            monthlyLimit: b.limit,
            month: currentMonth,
            year: currentYear,
          },
        });
      }
    }

    // Create demo savings goals
    await db.savingsGoal.create({
      data: {
        userId: user.id,
        name: "Summer Vacation",
        targetAmount: 5000,
        currentAmount: 2350,
        currency: "RON",
        deadline: new Date(currentYear, 6, 1),
      },
    });

    await db.savingsGoal.create({
      data: {
        userId: user.id,
        name: "New Laptop",
        targetAmount: 4500,
        currentAmount: 1200,
        currency: "RON",
        deadline: new Date(currentYear, 11, 1),
      },
    });

    await db.savingsGoal.create({
      data: {
        userId: user.id,
        name: "Emergency Fund",
        targetAmount: 10000,
        currentAmount: 7500,
        currency: "RON",
      },
    });
  }

  // Redirect to login page with demo credentials auto-filled
  const url = new URL("/login?demo=true", process.env.AUTH_URL || "http://localhost:3000");
  return NextResponse.redirect(url);
}
