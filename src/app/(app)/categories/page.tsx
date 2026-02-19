"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Category = {
  id: string;
  name: string;
  icon: string | null;
  isDefault: boolean;
  userId: string | null;
  keywords: string[];
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [keywords, setKeywords] = useState("");
  const [saving, setSaving] = useState(false);

  function fetchCategories() {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        setCategories(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => {
    fetchCategories();
  }, []);

  function openCreate() {
    setEditing(null);
    setName("");
    setIcon("📁");
    setKeywords("");
    setDialogOpen(true);
  }

  function openEdit(cat: Category) {
    setEditing(cat);
    setName(cat.name);
    setIcon(cat.icon || "📁");
    setKeywords((cat.keywords || []).join(", "));
    setDialogOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    const keywordList = keywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    try {
      const url = editing
        ? `/api/categories/${editing.id}`
        : "/api/categories";
      const res = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, icon, keywords: keywordList }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to save");
        return;
      }
      toast.success(editing ? "Category updated" : "Category created");
      setDialogOpen(false);
      fetchCategories();
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(cat: Category) {
    if (!confirm(`Delete category "${cat.name}"?`)) return;
    try {
      const res = await fetch(`/api/categories/${cat.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to delete");
        return;
      }
      toast.success("Category deleted");
      fetchCategories();
    } catch {
      toast.error("Failed to delete");
    }
  }

  const defaultCats = categories.filter((c) => c.isDefault);
  const customCats = categories.filter((c) => !c.isDefault);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Categories</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              New Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editing ? "Edit Category" : "New Category"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="space-y-2">
                  <Label>Icon</Label>
                  <Input
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="w-16 text-center text-lg"
                    maxLength={2}
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Category name"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Keywords (comma-separated)</Label>
                <Input
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="e.g. netflix, spotify, youtube"
                />
                <p className="text-xs text-muted-foreground">
                  Keywords help auto-categorize imported transactions.
                </p>
              </div>
              <Button
                onClick={handleSave}
                disabled={saving || !name}
                className="w-full"
              >
                {saving ? "Saving..." : editing ? "Update" : "Create"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Custom categories */}
      {customCats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Categories</CardTitle>
            <CardDescription>
              Custom categories you created. You can edit or delete them.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {customCats.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{cat.icon}</span>
                    <div>
                      <p className="font-medium">{cat.name}</p>
                      {cat.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {cat.keywords.map((kw) => (
                            <Badge key={kw} variant="secondary" className="text-xs">
                              {kw}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEdit(cat)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDelete(cat)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Default categories */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Default Categories</CardTitle>
          <CardDescription>
            Built-in categories available to all users.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {loading
              ? [...Array(6)].map((_, i) => (
                  <div key={i} className="h-12 animate-pulse rounded bg-muted" />
                ))
              : defaultCats.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    <span className="text-xl">{cat.icon}</span>
                    <div>
                      <p className="font-medium">{cat.name}</p>
                      {cat.keywords.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {cat.keywords.slice(0, 3).join(", ")}
                          {cat.keywords.length > 3 && ` +${cat.keywords.length - 3} more`}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
