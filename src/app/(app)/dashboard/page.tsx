"use client";

import { useState } from "react";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { WelcomeCard } from "@/components/dashboard/welcome-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const periodLabels: Record<string, string> = {
  "this-month": "This Month",
  "last-month": "Last Month",
  "this-year": "This Year",
};

export default function DashboardPage() {
  const [period, setPeriod] = useState("this-month");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent position="popper" className="w-[150px]">
            <SelectItem value="this-month">This Month</SelectItem>
            <SelectItem value="last-month">Last Month</SelectItem>
            <SelectItem value="this-year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <WelcomeCard />
      <SummaryCards period={period} periodLabel={periodLabels[period]} />
      <RecentTransactions />
    </div>
  );
}
