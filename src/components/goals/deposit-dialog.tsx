"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type DepositDialogProps = {
  goalId: string;
  goalName: string;
  operation: "deposit" | "withdraw";
  onSuccess?: () => void;
  children: React.ReactNode;
};

export function DepositDialog({
  goalId,
  goalName,
  operation,
  onSuccess,
  children,
}: DepositDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = parseFloat(amount);
    if (!value || value <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setLoading(true);

    const res = await fetch(`/api/goals/${goalId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ operation, amount: value }),
    });

    if (!res.ok) {
      toast.error(`Failed to ${operation}`);
      setLoading(false);
      return;
    }

    toast.success(
      operation === "deposit"
        ? `Added to "${goalName}"`
        : `Withdrawn from "${goalName}"`
    );
    setAmount("");
    setOpen(false);
    setLoading(false);
    onSuccess?.();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {operation === "deposit" ? "Add Money" : "Withdraw"} — {goalName}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading
              ? "Saving..."
              : operation === "deposit"
                ? "Add Money"
                : "Withdraw"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
