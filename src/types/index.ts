import type { Account, Category, Transaction } from "@/generated/prisma/client";

export type TransactionWithRelations = Transaction & {
  account: Account;
  category: Category;
};

export type DashboardSummary = {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  transactionCount: number;
  currency: string;
};

export type TransactionFilters = {
  categoryId?: string;
  type?: "INCOME" | "EXPENSE";
  dateFrom?: string;
  dateTo?: string;
};
