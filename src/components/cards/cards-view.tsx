"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, CreditCard } from "lucide-react";
import { BANK_NAMES, CARD_TYPES, CURRENCIES } from "@/types/shared";
import type { CardWithOwner, Person } from "@/lib/supabase/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  bank: BANK_NAMES[0],
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
  const [form, setForm] = useState<CardForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(name: keyof CardForm, value: string) {
    setForm((prev) => ({ ...prev, [name]: value }));
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

    const res = await fetch("/api/cards", {
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
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" />
              Nueva tarjeta
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Nueva tarjeta</DialogTitle>
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
                  <Label>Banco</Label>
                  <Select value={form.bank} onValueChange={(v) => set("bank", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BANK_NAMES.map((b) => (
                        <SelectItem key={b} value={b}>
                          {b}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Tipo</Label>
                  <Select value={form.card_type} onValueChange={(v) => set("card_type", v)}>
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
                {submitting ? "Guardando…" : "Guardar tarjeta"}
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
            <Card key={card.id} className={card.active ? "" : "opacity-60"}>
              <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{card.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {card.bank} · {TYPE_LABELS[card.card_type] ?? card.card_type} ····{card.last4}
                    </p>
                  </div>
                  <Badge variant={card.active ? "default" : "secondary"}>
                    {card.active ? "Activa" : "Inactiva"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <p className="text-muted-foreground">
                    {card.people?.name ?? "Sin dueño"}
                    {card.currency ? ` · ${card.currency}` : ""}
                    {card.closing_day ? ` · Cierre día ${card.closing_day}` : ""}
                    {card.payment_day ? ` · Pago día ${card.payment_day}` : ""}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleActive(card)}
                  >
                    {card.active ? "Desactivar" : "Activar"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}