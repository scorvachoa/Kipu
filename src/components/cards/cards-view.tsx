"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, CreditCard, Pencil } from "lucide-react";
import { BANK_NAMES, CARD_TYPES, CURRENCIES } from "@/types/shared";
import type { CardWithOwner, Person } from "@/lib/supabase/queries";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

const TYPE_LABELS: Record<string, string> = {
  credit: "Crédito",
  debit: "Débito",
};

const BANK_BORDERS: Record<string, string> = {
  BCP: "border-indigo-500",
  INTERBANK: "border-emerald-500",
  "BCP IO": "border-slate-500",
  BBVA: "border-blue-500",
  SCOTIABANK: "border-rose-500",
  MIBANCO: "border-violet-500",
  BANBIF: "border-cyan-500",
  "BANCO DE LA NACION": "border-amber-500",
  CAJA: "border-orange-500",
  FINANCIERA: "border-fuchsia-500",
  OTRO: "border-slate-400",
};

function bankBorder(bank: string): string {
  return BANK_BORDERS[bank.toUpperCase()] ?? BANK_BORDERS.OTRO;
}

interface CardForm {
  bank: string;
  name: string;
  card_type: string;
  last4: string;
  owner_person_id: string;
  currency: string;
  closing_day: string;
  payment_day: string;
}

const EMPTY_FORM: CardForm = {
  bank: "",
  name: "",
  card_type: "credit",
  last4: "",
  owner_person_id: "",
  currency: "PEN",
  closing_day: "",
  payment_day: "",
};

export function CardsView({
  cards,
  people,
}: {
  cards: CardWithOwner[];
  people: Person[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CardWithOwner | null>(null);
  const [form, setForm] = useState<CardForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(name: keyof CardForm, value: string) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function openCreate() {
    setEditingCard(null);
    setForm(EMPTY_FORM);
    setError(null);
    setOpen(true);
  }

  function openEdit(card: CardWithOwner) {
    setEditingCard(card);
    setForm({
      bank: card.bank,
      name: card.name,
      card_type: card.card_type,
      last4: card.last4,
      owner_person_id: card.owner_person_id ?? "",
      currency: card.currency ?? "PEN",
      closing_day: card.closing_day != null ? String(card.closing_day) : "",
      payment_day: card.payment_day != null ? String(card.payment_day) : "",
    });
    setError(null);
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload: Record<string, unknown> = {
      bank: form.bank,
      name: form.name,
      card_type: form.card_type,
      last4: form.last4,
      currency: form.currency,
    };
    if (form.owner_person_id) payload.owner_person_id = form.owner_person_id;
    if (form.closing_day) payload.closing_day = Number(form.closing_day);
    if (form.payment_day) payload.payment_day = Number(form.payment_day);

    const res = editingCard
      ? await fetch(`/api/cards/${editingCard.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/cards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
    const body = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(body.error ?? "No se pudo guardar la tarjeta.");
      setSubmitting(false);
      return;
    }
    setForm(EMPTY_FORM);
    setEditingCard(null);
    setOpen(false);
    setSubmitting(false);
    router.refresh();
  }

  async function toggleActive(card: CardWithOwner) {
    await fetch(`/api/cards/${card.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !card.active }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Tarjetas</h1>
          <p className="text-sm text-muted-foreground">
            Tus tarjetas de crédito y débito
          </p>
        </div>
        <Dialog open={open} onOpenChange={(o) => {
          setOpen(o);
          if (!o) setEditingCard(null);
        }}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Nueva tarjeta
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingCard ? "Editar tarjeta" : "Nueva tarjeta"}
              </DialogTitle>
              <DialogDescription>
                Las compras de Gmail se vincularán por banco y últimos 4 dígitos.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="card-name">Nombre</Label>
                <Input
                  id="card-name"
                  placeholder="BCP Visa Clásica"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="card-bank">Banco</Label>
                  <Input
                    list="known-banks"
                    id="card-bank"
                    placeholder="BCP, INTERBANK, BBVA…"
                    value={form.bank}
                    onChange={(e) => set("bank", e.target.value)}
                    required
                  />
                  <datalist id="known-banks">
                    {BANK_NAMES.map((b) => (
                      <option key={b} value={b} />
                    ))}
                  </datalist>
                </div>
                <div className="grid gap-2">
                  <Label>Tipo</Label>
                  <Select
                    value={form.card_type}
                    onValueChange={(v) => {
                      set("card_type", v);
                      if (v === "debit") {
                        set("closing_day", "");
                        set("payment_day", "");
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CARD_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {TYPE_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="card-last4">Últimos 4 dígitos</Label>
                  <Input
                    id="card-last4"
                    inputMode="numeric"
                    maxLength={4}
                    pattern="\d{4}"
                    placeholder="1234"
                    value={form.last4}
                    onChange={(e) => set("last4", e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Dueño</Label>
                  <Select
                    value={form.owner_person_id}
                    onValueChange={(v) => set("owner_person_id", v === "none" ? "" : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sin dueño" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin dueño</SelectItem>
                      {people.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="grid gap-2">
                  <Label>Moneda</Label>
                  <Select value={form.currency} onValueChange={(v) => set("currency", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="card-closing">Cierre (día)</Label>
                  <Input
                    id="card-closing"
                    inputMode="numeric"
                    min={1}
                    max={31}
                    placeholder="—"
                    value={form.closing_day}
                    disabled={form.card_type === "debit"}
                    onChange={(e) => set("closing_day", e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="card-payday">Pago (día)</Label>
                  <Input
                    id="card-payday"
                    inputMode="numeric"
                    min={1}
                    max={31}
                    placeholder="—"
                    value={form.payment_day}
                    disabled={form.card_type === "debit"}
                    onChange={(e) => set("payment_day", e.target.value)}
                  />
                </div>
              </div>
              {error ? (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}
              <Button type="submit" disabled={submitting}>
                {submitting
                  ? "Guardando…"
                  : editingCard
                    ? "Guardar cambios"
                    : "Guardar tarjeta"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {cards.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            <CreditCard className="mx-auto mb-3 h-8 w-8 text-muted-foreground/60" />
            Aún no tienes tarjetas. Crea la primera para que las compras se vinculen.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {cards.map((card) => (
            <div
              key={card.id}
              className={`flex flex-col overflow-hidden rounded-2xl border-2 bg-card p-5 ${bankBorder(card.bank)} ${card.active ? "" : "opacity-70"}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
                    {card.bank}
                  </p>
                  <p className="mt-0.5 text-base font-semibold">
                    {card.name}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                    {TYPE_LABELS[card.card_type] ?? card.card_type}
                  </span>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">
                    {card.active ? "Activa" : "Inactiva"}
                  </span>
                </div>
              </div>
              <div className="mt-5 font-mono text-sm tracking-[0.25em] text-muted-foreground">
                •••• •••• •••• {card.last4}
              </div>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span>{card.people?.name ?? "Sin dueño"}</span>
                <span className="text-xs text-muted-foreground">
                  {card.currency ?? "PEN"}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                {card.closing_day || card.payment_day ? (
                  <p className="text-xs text-muted-foreground">
                    {card.closing_day ? `Cierre día ${card.closing_day}` : ""}
                    {card.closing_day && card.payment_day ? " · " : ""}
                    {card.payment_day ? `Pago día ${card.payment_day}` : ""}
                  </p>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {card.card_type === "debit"
                      ? "Tarjeta de débito"
                      : "Crédito"}
                  </span>
                )}
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(card)}>
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleActive(card)}
                  >
                    {card.active ? "Desactivar" : "Activar"}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}