"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TransactionForm } from "./transaction-form";
import { DeleteTransactionDialog } from "./delete-transaction-dialog";
import type { TransactionWithRelations } from "@/types";

export function TransactionList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [transactions, setTransactions] = useState<TransactionWithRelations[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const currentPage = parseInt(searchParams.get("page") || "1");
  const currentPageSize = parseInt(searchParams.get("pageSize") || "10");

  const fetchTransactions = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams(searchParams.toString());
    if (!params.has("page")) params.set("page", "1");
    if (!params.has("pageSize")) params.set("pageSize", "10");
    fetch(`/api/transactions?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setTransactions(data.transactions || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [searchParams]);

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`/transactions?${params.toString()}`);
  }

  function changePageSize(size: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("pageSize", size);
    params.set("page", "1"); // reset to first page
    router.push(`/transactions?${params.toString()}`);
  }

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded bg-muted" />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">
          No transactions found. Add your first transaction to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
    <div className="rounded-md border overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Account</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((t) => (
            <TableRow key={t.id}>
              <TableCell className="text-muted-foreground">
                {format(new Date(t.date), "MMM d, yyyy")}
              </TableCell>
              <TableCell>{t.description || "-"}</TableCell>
              <TableCell>
                <Badge variant="outline">
                  {t.category.icon} {t.category.name}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {t.account.name}
              </TableCell>
              <TableCell
                className={`text-right font-medium ${
                  t.type === "INCOME" ? "text-emerald-500" : "text-red-500"
                }`}
              >
                {t.type === "INCOME" ? "+" : "-"}
                {formatCurrency(Number(t.amount), t.account.currency)}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <TransactionForm
                    transaction={t}
                    onSuccess={fetchTransactions}
                  >
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TransactionForm>
                  <DeleteTransactionDialog
                    transactionId={t.id}
                    onSuccess={fetchTransactions}
                  >
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </DeleteTransactionDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>

    {/* Pagination */}
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Rows per page</span>
        <Select value={String(currentPageSize)} onValueChange={changePageSize}>
          <SelectTrigger className="w-[70px] h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper" className="w-[70px]">
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="25">25</SelectItem>
            <SelectItem value="50">50</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {(currentPage - 1) * currentPageSize + 1}–{Math.min(currentPage * currentPageSize, total)} of {total}
        </span>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => goToPage(currentPage - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </Button>
          <span className="text-sm text-muted-foreground">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => goToPage(currentPage + 1)}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
    </div>
  );
}
