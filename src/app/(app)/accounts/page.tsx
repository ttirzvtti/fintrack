"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Landmark, CreditCard, PiggyBank, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AccountForm } from "@/components/accounts/account-form";
import { DeleteAccountDialog } from "@/components/accounts/delete-account-dialog";
import type { Account } from "@/generated/prisma/client";

const typeIcons: Record<string, typeof Landmark> = {
  CHECKING: Landmark,
  SAVINGS: PiggyBank,
  CREDIT: CreditCard,
  CASH: Wallet,
};

const typeLabels: Record<string, string> = {
  CHECKING: "Checking",
  SAVINGS: "Savings",
  CREDIT: "Credit",
  CASH: "Cash",
};

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAccounts = useCallback(() => {
    setLoading(true);
    fetch("/api/accounts")
      .then((res) => res.json())
      .then((data) => {
        setAccounts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Accounts</h1>
        <AccountForm onSuccess={fetchAccounts}>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Account
          </Button>
        </AccountForm>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-5 w-32 animate-pulse rounded bg-muted" />
              </CardHeader>
              <CardContent>
                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Landmark className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No accounts yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first account to start tracking transactions.
            </p>
            <AccountForm onSuccess={fetchAccounts}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Account
              </Button>
            </AccountForm>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => {
            const Icon = typeIcons[account.type] || Landmark;
            return (
              <Card key={account.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    {account.name}
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    <AccountForm account={account} onSuccess={fetchAccounts}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </AccountForm>
                    <DeleteAccountDialog
                      accountId={account.id}
                      accountName={account.name}
                      onSuccess={fetchAccounts}
                    >
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </DeleteAccountDialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{typeLabels[account.type]}</Badge>
                    <Badge variant="outline">{account.currency}</Badge>
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
