"use client";

import { Suspense, useCallback, useState } from "react";
import { Plus, PlusCircle, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TransactionList } from "@/components/transactions/transaction-list";
import { TransactionFilters } from "@/components/transactions/transaction-filters";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { AccountForm } from "@/components/accounts/account-form";

export default function TransactionsPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  async function handleExport() {
    try {
      // Fetch all transactions with current filters from URL
      const params = new URLSearchParams(window.location.search);
      params.set("limit", "10000"); // fetch all for export
      params.delete("page");
      const res = await fetch(`/api/transactions?${params}`);
      const data = await res.json();
      const transactions = data.transactions || [];

      if (transactions.length === 0) {
        toast.error("No transactions to export");
        return;
      }

      // Build CSV
      const headers = ["Date", "Description", "Category", "Type", "Amount", "Account", "Currency"];
      const rows = transactions.map((t: {
        date: string;
        description?: string;
        category: { name: string };
        type: string;
        amount: number;
        account: { name: string; currency: string };
      }) => [
        new Date(t.date).toISOString().split("T")[0],
        `"${(t.description || "").replace(/"/g, '""')}"`,
        t.category.name,
        t.type,
        Number(t.amount).toFixed(2),
        t.account.name,
        t.account.currency,
      ]);

      const csv = [headers.join(","), ...rows.map((r: string[]) => r.join(","))].join("\n");

      // Download
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `fintrack-transactions-${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success(`Exported ${transactions.length} transactions`);
    } catch {
      toast.error("Failed to export");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold">Transactions</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <AccountForm>
            <Button variant="outline" size="sm">
              <PlusCircle className="mr-2 h-4 w-4" />
              Account
            </Button>
          </AccountForm>
          <TransactionForm onSuccess={refresh}>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Transaction
            </Button>
          </TransactionForm>
        </div>
      </div>
      <Suspense>
        <TransactionFilters />
        <TransactionList key={refreshKey} />
      </Suspense>
    </div>
  );
}
