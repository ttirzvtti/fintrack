"use client";

import { useCallback, useEffect, useState } from "react";
import Papa from "papaparse";
import { Upload, FileSpreadsheet, ArrowRight, ArrowLeft, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import type { Account, Category } from "@/generated/prisma/client";

type Step = "upload" | "mapping" | "preview";

type ParsedRow = Record<string, string>;

type MappedTransaction = {
  date: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  description: string;
  categoryId: string;
  categoryName: string;
};

export default function ImportPage() {
  const [step, setStep] = useState<Step>("upload");
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");

  // Column mapping
  const [dateCol, setDateCol] = useState("");
  const [amountCol, setAmountCol] = useState("");
  const [descriptionCol, setDescriptionCol] = useState("");
  const [typeCol, setTypeCol] = useState("");

  // Preview
  const [mappedRows, setMappedRows] = useState<MappedTransaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/accounts").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
    ]).then(([acc, cat]) => {
      setAccounts(Array.isArray(acc) ? acc : []);
      setCategories(Array.isArray(cat) ? cat : []);
      if (Array.isArray(acc) && acc.length > 0) {
        setSelectedAccount(acc[0].id);
      }
    });
  }, []);

  function handleFileUpload(file: File) {
    setFileName(file.name);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        const headers = results.meta.fields || [];
        const data = results.data as ParsedRow[];

        if (headers.length === 0 || data.length === 0) {
          toast.error("Could not parse CSV. Make sure it has headers and data.");
          return;
        }

        setCsvHeaders(headers);
        setCsvData(data);

        // Auto-detect columns
        for (const h of headers) {
          const lower = h.toLowerCase();
          if (!dateCol && (lower.includes("date") || lower.includes("data"))) setDateCol(h);
          if (!amountCol && (lower.includes("amount") || lower.includes("suma") || lower.includes("sum") || lower.includes("value"))) setAmountCol(h);
          if (!descriptionCol && (lower.includes("desc") || lower.includes("detail") || lower.includes("reference") || lower.includes("merchant") || lower.includes("beneficiar"))) setDescriptionCol(h);
          if (!typeCol && (lower.includes("type") || lower.includes("tip") || lower.includes("credit") || lower.includes("debit"))) setTypeCol(h);
        }

        setStep("mapping");
        toast.success(`Parsed ${data.length} rows from ${file.name}`);
      },
      error() {
        toast.error("Failed to parse CSV file");
      },
    });
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith(".csv") || file.type === "text/csv")) {
      handleFileUpload(file);
    } else {
      toast.error("Please upload a CSV file");
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  }

  const processMapping = useCallback(async () => {
    if (!dateCol || !amountCol) {
      toast.error("Please map at least Date and Amount columns");
      return;
    }

    const otherCategory = categories.find((c) => c.name === "Other");
    const fallbackCategoryId = otherCategory?.id || categories[0]?.id || "";

    // Parse rows
    const rows: MappedTransaction[] = [];
    for (const row of csvData) {
      const rawAmount = parseFloat(row[amountCol]?.replace(/[^0-9.\-,]/g, "").replace(",", ".") || "0");
      if (rawAmount === 0 || isNaN(rawAmount)) continue;

      let type: "INCOME" | "EXPENSE";
      if (typeCol && row[typeCol]) {
        const typeVal = row[typeCol].toLowerCase();
        type = (typeVal.includes("credit") || typeVal.includes("income") || typeVal.includes("in"))
          ? "INCOME"
          : "EXPENSE";
      } else {
        type = rawAmount > 0 ? "INCOME" : "EXPENSE";
      }

      const amount = Math.abs(rawAmount);
      const description = descriptionCol ? (row[descriptionCol] || "") : "";

      // Parse date — try multiple formats
      let date = row[dateCol] || "";
      const parsed = new Date(date);
      if (!isNaN(parsed.getTime())) {
        date = parsed.toISOString().split("T")[0];
      }

      rows.push({
        date,
        amount,
        type,
        description,
        categoryId: fallbackCategoryId,
        categoryName: "Other",
      });
    }

    // Auto-categorize via API
    if (rows.length > 0 && descriptionCol) {
      try {
        const res = await fetch("/api/import", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ descriptions: rows.map((r) => r.description) }),
        });
        const { categoryIds } = await res.json();
        for (let i = 0; i < rows.length; i++) {
          if (categoryIds[i]) {
            rows[i].categoryId = categoryIds[i];
            const cat = categories.find((c) => c.id === categoryIds[i]);
            if (cat) rows[i].categoryName = `${cat.icon || ""} ${cat.name}`;
          }
        }
      } catch {
        // Fall back to "Other" — auto-categorization is best-effort
      }
    }

    setMappedRows(rows);
    setStep("preview");
  }, [dateCol, amountCol, descriptionCol, typeCol, csvData, categories]);

  async function handleImport() {
    if (!selectedAccount) {
      toast.error("Please select an account");
      return;
    }

    setImporting(true);

    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: selectedAccount,
          rows: mappedRows.map((r) => ({
            amount: r.amount,
            type: r.type,
            description: r.description,
            date: r.date,
            categoryId: r.categoryId,
          })),
        }),
      });

      if (!res.ok) {
        try {
          const body = await res.json();
          toast.error(body.error || "Import failed");
        } catch {
          toast.error("Import failed");
        }
        setImporting(false);
        return;
      }

      const { created } = await res.json();
      toast.success(`Successfully imported ${created} transactions!`);
      setDone(true);
    } catch {
      toast.error("Import failed");
    }
    setImporting(false);
  }

  function handleCategoryChange(index: number, categoryId: string) {
    setMappedRows((prev) => {
      const updated = [...prev];
      const cat = categories.find((c) => c.id === categoryId);
      updated[index] = {
        ...updated[index],
        categoryId,
        categoryName: cat ? `${cat.icon || ""} ${cat.name}` : "Other",
      };
      return updated;
    });
  }

  function reset() {
    setStep("upload");
    setCsvHeaders([]);
    setCsvData([]);
    setFileName("");
    setDateCol("");
    setAmountCol("");
    setDescriptionCol("");
    setTypeCol("");
    setMappedRows([]);
    setDone(false);
  }

  // ── STEP 1: Upload ──
  if (step === "upload") {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Import CSV</h1>
        <Card>
          <CardContent className="pt-6">
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-12 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
              onClick={() => document.getElementById("csv-input")?.click()}
            >
              <Upload className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-1">
                Drop your CSV file here
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                Supports bank statement CSVs with date, amount, and description columns
              </p>
              <input
                id="csv-input"
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileInput}
                className="hidden"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── STEP 2: Column Mapping ──
  if (step === "mapping") {
    const columnOptions = csvHeaders.map((h) => ({ value: h, label: h }));

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Map Columns</h1>
            <p className="text-sm text-muted-foreground mt-1">
              <FileSpreadsheet className="inline h-4 w-4 mr-1" />
              {fileName} — {csvData.length} rows
            </p>
          </div>
          <Button variant="outline" onClick={() => setStep("upload")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tell us which columns match</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Date column <span className="text-destructive">*</span>
                </label>
                <Select value={dateCol} onValueChange={setDateCol}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    {columnOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Amount column <span className="text-destructive">*</span>
                </label>
                <Select value={amountCol} onValueChange={setAmountCol}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    {columnOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Description column
                </label>
                <Select value={descriptionCol} onValueChange={setDescriptionCol}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select column (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {columnOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Type column
                </label>
                <Select value={typeCol} onValueChange={setTypeCol}>
                  <SelectTrigger>
                    <SelectValue placeholder="Auto-detect from amount sign" />
                  </SelectTrigger>
                  <SelectContent>
                    {columnOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Preview first 3 rows */}
            {csvData.length > 0 && (
              <div className="mt-6">
                <p className="text-sm font-medium mb-2">Preview (first 3 rows):</p>
                <div className="rounded-md border overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {csvHeaders.map((h) => (
                          <TableHead key={h} className="text-xs whitespace-nowrap">
                            {h}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {csvData.slice(0, 3).map((row, i) => (
                        <TableRow key={i}>
                          {csvHeaders.map((h) => (
                            <TableCell key={h} className="text-xs whitespace-nowrap">
                              {row[h] || "—"}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            <Button
              onClick={processMapping}
              disabled={!dateCol || !amountCol}
              className="w-full sm:w-auto"
            >
              Continue to Preview
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── STEP 3: Preview & Import ──
  if (done) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Import Complete</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mb-4">
              <Check className="h-8 w-8 text-emerald-600" />
            </div>
            <p className="text-lg font-medium mb-2">
              {mappedRows.length} transactions imported!
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Your transactions have been added to your account.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={reset}>
                Import Another File
              </Button>
              <Button onClick={() => window.location.href = "/transactions"}>
                View Transactions
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const incomeCount = mappedRows.filter((r) => r.type === "INCOME").length;
  const expenseCount = mappedRows.filter((r) => r.type === "EXPENSE").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Preview Import</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mappedRows.length} transactions — {incomeCount} income, {expenseCount} expenses
          </p>
        </div>
        <Button variant="outline" onClick={() => setStep("mapping")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Import into account</CardTitle>
            <Select value={selectedAccount} onValueChange={setSelectedAccount}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name} ({a.currency})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-auto max-h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Category</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mappedRows.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell className="whitespace-nowrap">{row.date}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {row.description || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={row.type === "INCOME" ? "default" : "destructive"}
                      >
                        {row.type}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${
                        row.type === "INCOME" ? "text-emerald-500" : "text-red-500"
                      }`}
                    >
                      {row.type === "INCOME" ? "+" : "-"}{row.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={row.categoryId}
                        onValueChange={(v) => handleCategoryChange(i, v)}
                      >
                        <SelectTrigger className="w-[150px] h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.icon} {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              onClick={handleImport}
              disabled={importing || !selectedAccount}
              size="lg"
            >
              {importing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Import {mappedRows.length} Transactions
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
