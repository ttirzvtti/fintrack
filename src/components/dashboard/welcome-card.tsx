"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowRight, Landmark, Upload } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function WelcomeCard() {
  const { data: session } = useSession();
  const [hasAccounts, setHasAccounts] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/accounts")
      .then((r) => r.json())
      .then((data) => {
        setHasAccounts(Array.isArray(data) && data.length > 0);
      })
      .catch(() => setHasAccounts(false));
  }, []);

  // Don't show if still loading or if user already has accounts
  if (hasAccounts === null || hasAccounts) return null;

  const firstName = session?.user?.name?.split(" ")[0] || "there";

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardContent className="pt-6">
        <h2 className="text-2xl font-bold mb-2">Welcome, {firstName}!</h2>
        <p className="text-muted-foreground mb-6">
          Get started by setting up your first account. Here&apos;s how:
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-start gap-3 rounded-lg border bg-card p-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
              1
            </div>
            <div>
              <p className="font-medium text-sm">Create an Account</p>
              <p className="text-xs text-muted-foreground mt-1">
                Add your bank account with currency
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border bg-card p-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
              2
            </div>
            <div>
              <p className="font-medium text-sm">Add Transactions</p>
              <p className="text-xs text-muted-foreground mt-1">
                Manually or import from CSV
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border bg-card p-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
              3
            </div>
            <div>
              <p className="font-medium text-sm">Set Budgets</p>
              <p className="text-xs text-muted-foreground mt-1">
                Control spending per category
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border bg-card p-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
              4
            </div>
            <div>
              <p className="font-medium text-sm">Track Insights</p>
              <p className="text-xs text-muted-foreground mt-1">
                See trends and forecasts
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/accounts">
              <Landmark className="mr-2 h-4 w-4" />
              Create Your First Account
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/import">
              <Upload className="mr-2 h-4 w-4" />
              Import CSV
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
