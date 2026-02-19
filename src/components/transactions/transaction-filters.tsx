"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { CalendarIcon, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Category } from "@/generated/prisma/client";

export function TransactionFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);

  const currentCategory = searchParams.get("categoryId") || "all";
  const currentType = searchParams.get("type") || "all";
  const currentDateFrom = searchParams.get("dateFrom");
  const currentDateTo = searchParams.get("dateTo");
  const currentSearch = searchParams.get("search") || "";
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {});
  }, []);

  useEffect(() => {
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, []);

  function updateFilter(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page"); // reset to page 1 on filter change
    router.push(`/transactions?${params.toString()}`);
  }

  function handleSearchChange(value: string) {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      updateFilter("search", value || null);
    }, 300);
  }

  function clearFilters() {
    router.push("/transactions");
  }

  const hasFilters =
    currentCategory !== "all" ||
    currentType !== "all" ||
    currentDateFrom ||
    currentDateTo ||
    currentSearch;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative w-full sm:w-[220px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search description..."
          defaultValue={currentSearch}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select
        value={currentCategory}
        onValueChange={(v) => updateFilter("categoryId", v)}
      >
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>
              {cat.icon} {cat.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={currentType}
        onValueChange={(v) => updateFilter("type", v)}
      >
        <SelectTrigger className="w-full sm:w-[140px]">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="INCOME">Income</SelectItem>
          <SelectItem value="EXPENSE">Expense</SelectItem>
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[140px] justify-start text-left font-normal",
              !currentDateFrom && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {currentDateFrom
              ? format(new Date(currentDateFrom), "MMM d, yy")
              : "From"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={currentDateFrom ? new Date(currentDateFrom) : undefined}
            onSelect={(date) =>
              updateFilter(
                "dateFrom",
                date ? format(date, "yyyy-MM-dd") : null
              )
            }
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[140px] justify-start text-left font-normal",
              !currentDateTo && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {currentDateTo
              ? format(new Date(currentDateTo), "MMM d, yy")
              : "To"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={currentDateTo ? new Date(currentDateTo) : undefined}
            onSelect={(date) =>
              updateFilter("dateTo", date ? format(date, "yyyy-MM-dd") : null)
            }
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {hasFilters && (
        <Button variant="ghost" onClick={clearFilters} size="sm">
          Clear filters
        </Button>
      )}
    </div>
  );
}
