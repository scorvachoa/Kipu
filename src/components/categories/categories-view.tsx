"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, Pencil, Plus, Tags } from "lucide-react";
import type { Category } from "@/lib/supabase/queries";
import { formatMoney } from "@/lib/format";
import { DEFAULT_CURRENCY } from "@/types/shared";
import { CATEGORY_COLORS } from "@/lib/category-style";
import { CATEGORY_ICON_OPTIONS, CategoryIcon } from "@/components/category-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

type FormState = { name: string; icon: string; color: string; budget: string };

const EMPTY: FormState = { name: "", icon: "", color: "", budget: "" };

function budgetToFormValue(budget: number | null): string {
  if (budget === null) return "";
  return String(budget);
}

function parseBudget(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const number = Number(trimmed.replace(",", "."));
  if (Number.isNaN(number) || number < 0) return null;
  return Math.round(number * 100) / 100;
}

export function CategoriesView({
  categories,
  spendByCategory,
}: {
  categories: Category[];
  spendByCategory: Map<string, Record<string, number>>;
}) {
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
      budget: budgetToFormValue(category.monthly_budget),
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
    const budget = parseBudget(form.budget);
    if (form.budget.trim() !== "" && budget === null) {
      setError("El presupuesto debe ser un número mayor o igual a 0.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const payload = {
      name: form.name,
      icon: form.icon || null,
      color: form.color || null,
      monthly_budget: budget,
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
            Agrupa tus gastos y define un presupuesto mensual
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
        description="Elige un color, un icono y, opcionalmente, un presupuesto mensual."
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
            const spendByCurrency = spendByCategory.get(category.id) ?? {};
            const primary = pickPrimaryCurrency(spendByCurrency);
            const spent = spendByCurrency[primary] ?? 0;
            const budget = category.monthly_budget;
            return (
              <Card key={category.id} className="flex flex-col overflow-hidden">
                <Link
                  href={`/categories/${category.id}`}
                  className="group flex flex-1 flex-col gap-2 p-4 transition-colors hover:bg-muted/40"
                >
                  <p className="flex items-center gap-2 text-base font-semibold">
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
                    <span className="line-clamp-1">{category.name}</span>
                    <ArrowUpRight className="ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </p>
                  <CategoryBudgetProgress
                    spent={spent}
                    spendCurrency={primary}
                    budget={budget}
                    totalCurrencies={Object.keys(spendByCurrency).length}
                  />
                </Link>
                <div className="flex items-center justify-between border-t px-4 py-2 text-xs text-muted-foreground">
                  <span>
                    {category.parent_id ? "Subcategoría" : "Categoría"}
                    {budget !== null ? " · Meta mensual" : ""}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => openEdit(category)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function pickPrimaryCurrency(spendByCurrency: Record<string, number>): string {
  let best: string = DEFAULT_CURRENCY;
  let bestAmount = -1;
  for (const [currency, amount] of Object.entries(spendByCurrency)) {
    if (
      amount > bestAmount ||
      (amount === bestAmount && currency === DEFAULT_CURRENCY)
    ) {
      best = currency;
      bestAmount = amount;
    }
  }
  return best;
}

function CategoryBudgetProgress({
  spent,
  spendCurrency,
  budget,
  totalCurrencies,
}: {
  spent: number;
  spendCurrency: string;
  budget: number | null;
  totalCurrencies: number;
}) {
  const spentLabel = totalCurrencies > 1 ? `Gasto: ${formatMoney(spent, spendCurrency)} y ${totalCurrencies - 1} moneda(s) más` : `Gasto: ${formatMoney(spent, spendCurrency)}`;

  if (budget === null) {
    return (
      <p className="text-xs text-muted-foreground">
        {spent > 0 ? spentLabel : "Sin gastos este mes"}
      </p>
    );
  }

  const comparable = budget >= 0 && spendCurrency === DEFAULT_CURRENCY;
  const percent = comparable
    ? Math.min(100, Math.round((spent / budget) * 100))
    : 0;
  const overBudget = comparable && spent > budget;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span title={spentLabel}>{spentLabel}</span>
        <span className={overBudget ? "font-medium text-red-600" : "text-muted-foreground"}>
          {formatMoney(budget, DEFAULT_CURRENCY)}
        </span>
      </div>
      {comparable && budget > 0 ? (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all ${
              overBudget ? "bg-red-500" : "bg-emerald-500"
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
      ) : null}
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
            <Label htmlFor="category-budget">Presupuesto mensual (S/)</Label>
            <Input
              id="category-budget"
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              placeholder="Ej. 400"
              value={form.budget}
              onChange={(e) => onChange({ ...form, budget: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Déjalo vacío si la categoría no tiene límite.
            </p>
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