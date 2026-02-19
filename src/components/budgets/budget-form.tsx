"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Category } from "@/generated/prisma/client";

const budgetFormSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  monthlyLimit: z.number().positive("Limit must be positive"),
});

type BudgetFormInput = z.infer<typeof budgetFormSchema>;

type BudgetFormProps = {
  month: number;
  year: number;
  onSuccess?: () => void;
  children: React.ReactNode;
};

export function BudgetForm({ month, year, onSuccess, children }: BudgetFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const form = useForm<BudgetFormInput>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      categoryId: "",
      monthlyLimit: 0,
    },
  });

  useEffect(() => {
    if (open) {
      fetch("/api/categories")
        .then((r) => r.json())
        .then((data) => setCategories(Array.isArray(data) ? data : []));
    }
  }, [open]);

  async function onSubmit(data: BudgetFormInput) {
    setLoading(true);

    const res = await fetch("/api/budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, month, year }),
    });

    if (!res.ok) {
      try {
        const body = await res.json();
        toast.error(body.error || "Failed to save budget");
      } catch {
        toast.error("Failed to save budget");
      }
      setLoading(false);
      return;
    }

    toast.success("Budget saved");
    form.reset();
    setOpen(false);
    setLoading(false);
    onSuccess?.();
  }

  // Filter to expense-type categories only (not Salary/Freelance)
  const expenseCategories = categories.filter(
    (c) => !["Salary", "Freelance"].includes(c.name)
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set Budget</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {expenseCategories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.icon} {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="monthlyLimit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly Limit</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Saving..." : "Set Budget"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
