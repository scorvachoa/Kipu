"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Tags } from "lucide-react";
import type { Category } from "@/lib/supabase/queries";
import { CATEGORY_COLORS } from "@/lib/category-style";
import { CATEGORY_ICON_OPTIONS, CategoryIcon } from "@/components/category-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

type FormState = { name: string; icon: string; color: string };

const EMPTY: FormState = { name: "", icon: "", color: "" };

export function CategoriesView({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openCreate() {
    setForm(EMPTY);
    setError(null);
    setCreateOpen(true);
  }

  function openEdit(category: Category) {
    setForm({
      name: category.name,
      icon: category.icon ?? "",
      color: category.color ?? "",
    });
    setError(null);
    setEditing(category);
  }

  function close() {
    setCreateOpen(false);
    setEditing(null);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const payload = {
      name: form.name,
      icon: form.icon || null,
      color: form.color || null,
    };
    const res = await fetch(
      editing ? `/api/categories/${editing.id}` : "/api/categories",
      {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    const body = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(body.error ?? "No se pudo guardar la categoría.");
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
    close();
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Categorías</h1>
          <p className="text-sm text-muted-foreground">
            Agrupa tus gastos para analizarlos mejor
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nueva categoría
        </Button>
      </div>

      <CategoryDialog
        open={createOpen || editing !== null}
        onOpenChange={(open) => (open ? undefined : close())}
        title={editing ? "Editar categoría" : "Nueva categoría"}
        description="Elige un color y un icono para identificarla fácilmente."
        form={form}
        onChange={setForm}
        onSubmit={handleSubmit}
        submitting={submitting}
        error={error}
        submitLabel={editing ? "Guardar cambios" : "Guardar categoría"}
      />

      {categories.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            <Tags className="mx-auto mb-3 h-8 w-8 text-muted-foreground/60" />
            No hay categorías. Crea la primera.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((category) => {
            const color = category.color ?? undefined;
            return (
              <Card key={category.id}>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={
                        color
                          ? { backgroundColor: color, color: "#fff" }
                          : undefined
                      }
                    >
                      <CategoryIcon name={category.icon} className="h-4 w-4" />
                    </span>
                    {category.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between p-4 pt-0 text-xs text-muted-foreground">
                  <span>{category.parent_id ? "Subcategoría" : "Categoría"}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => openEdit(category)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CategoryDialog({
  open,
  onOpenChange,
  title,
  description,
  form,
  onChange,
  onSubmit,
  submitting,
  error,
  submitLabel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  form: FormState;
  onChange: (next: FormState) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  error: string | null;
  submitLabel: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="category-name">Nombre</Label>
            <Input
              id="category-name"
              placeholder="Comida"
              value={form.name}
              onChange={(e) => onChange({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => onChange({ ...form, color: form.color === c ? "" : c })}
                  className={`flex h-7 w-7 items-center justify-center rounded-full transition-transform ${
                    form.color === c
                      ? "scale-110 ring-2 ring-ring ring-offset-2 ring-offset-background"
                      : "hover:scale-110"
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Color ${c}`}
                >
                  {form.color === c ? (
                    <span className="text-[10px] font-bold text-white">✓</span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>
<div className="grid gap-2">
          <Label>Icono</Label>
          <div className="grid max-h-40 grid-cols-8 gap-1 overflow-y-auto rounded-md border p-2">
            {CATEGORY_ICON_OPTIONS.map(({ name, icon: Icon }) => (
              <button
                key={name}
                type="button"
                onClick={() =>
                  onChange({ ...form, icon: form.icon === name ? "" : name })
                }
                className={`flex h-9 w-9 items-center justify-center rounded-md transition-colors ${
                  form.icon === name
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
                aria-label={`Icono ${name}`}
                title={name}
              >
                <Icon className="h-4.5 w-4.5" />
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Sin icono seleccionado: se muestra la etiqueta genérica.
          </p>
        </div>
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <Button type="submit" disabled={submitting}>
            {submitting ? "Guardando…" : submitLabel}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
