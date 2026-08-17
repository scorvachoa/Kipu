"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { formatMoney, formatDateTime, monthOptions, cardNameWithLast4 } from "@/lib/format";
import { CategoryIcon } from "@/components/category-icon";
import { monthLabel } from "@/lib/finance/summary";
import { TRANSACTION_TYPES, BANK_NAMES } from "@/types/shared";
import type { SummaryTx } from "@/lib/finance/summary";
import type { CardWithOwner, Person, Category } from "@/lib/supabase/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const TYPE_LABELS: Record<string, string> = {
  purchase: "Compra",
  payment: "Pago de tarjeta",
  transfer: "Transferencia",
  withdrawal: "Retiro",
  refund: "Reembolso",
  fee: "Comisión",
  other: "Otro",
};

function SuggestRuleButton({ merchant }: { merchant: string | null }) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);

  if (state === "done") {
    return (
      <span className="text-xs font-medium text-emerald-600">
        {message ?? "Regla creada"}
      </span>
    );
  }

  if (state === "error") {
    return (
      <span className="text-xs font-medium text-red-600">
        {message ?? "Error"}
      </span>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-6 px-2 text-xs"
      disabled={state === "loading"}
      onClick={async () => {
        if (!merchant) return;
        setState("loading");
        try {
          const response = await fetch("/api/rules", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ merchant }),
          });
          if (!response.ok) {
            setState("error");
            setMessage("No se pudo crear la regla");
            return;
          }
          const data = (await response.json()) as {
            category_name: string | null;
          };
          setState("done");
          setMessage(
            data.category_name
              ? `Regla → ${data.category_name}`
              : "Regla creada",
          );
        } catch {
          setState("error");
          setMessage("Error de red");
        }
      }}
    >
      {state === "loading" ? "…" : "Sugerir regla"}
    </Button>
  );
}

export function TransactionsView({
  rows,
  cards,
  people,
  categories,
}: {
  rows: SummaryTx[];
  cards: CardWithOwner[];
  people: Person[];
  categories: Category[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasFilters = searchParams.size > 0;

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  const filterProps = (key: string) => ({
    value: searchParams.get(key) ?? "",
    onValueChange: (next: string) => update(key, next),
  });

  const [search, setSearch] = useState(searchParams.get("q") ?? "");

  function applySearch() {
    update("q", search);
  }

  function resetFilters() {
    setSearch("");
    router.replace(pathname);
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Transacciones</h1>
        <p className="text-sm text-muted-foreground">{rows.length} movimientos</p>
      </div>

      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[160px] flex-1">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Buscar comercio…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") applySearch();
                }}
              />
            </div>
            <Select {...filterProps("month")}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Mes" />
              </SelectTrigger>
              <SelectContent>
                {["", ...monthOptions()].map((m) => (
                  <SelectItem key={m || "all"} value={m}>
                    {m ? monthLabel(m) : "Todos los meses"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select {...filterProps("bank")}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Banco" />
              </SelectTrigger>
              <SelectContent>
                {["", ...BANK_NAMES].map((b) => (
                  <SelectItem key={b || "all"} value={b}>
                    {b || "Todos"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select {...filterProps("type")}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                {["", ...TRANSACTION_TYPES].map((t) => (
                  <SelectItem key={t || "all"} value={t}>
                    {t ? TYPE_LABELS[t] ?? t : "Todos"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select {...filterProps("card")}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Tarjeta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas</SelectItem>
                {cards.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select {...filterProps("person")}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Persona" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas</SelectItem>
                {people.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select {...filterProps("category")}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <span className="flex items-center gap-1.5">
                      {c.color ? (
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: c.color }}
                        />
                      ) : null}
                      <span>
                        <CategoryIcon name={c.icon} className="mr-1 inline h-3.5 w-3.5" />
                        {c.name}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasFilters ? (
              <Button variant="ghost" onClick={resetFilters}>
                <X className="h-4 w-4" />
                Limpiar
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No hay movimientos con estos filtros.
            <div className="mt-2">
              <Link href="/dashboard" className="text-primary hover:underline">
                Volver al resumen
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="hidden sm:block">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Comercio</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Tarjeta</TableHead>
                      <TableHead>Persona</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="whitespace-nowrap text-sm">
                          {formatDateTime(t.transaction_date, t.transaction_time)}
                        </TableCell>
                        <TableCell>
                          <span className="line-clamp-1 max-w-[220px]">
                            {t.merchant ?? "—"}
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {t.categories ? (
                            <span className="flex items-center gap-1.5">
                              {t.categories.color ? (
                                <span
                                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                                  style={{ backgroundColor: t.categories.color }}
                                />
                              ) : null}
                              <span>
                                <CategoryIcon
                                  name={t.categories.icon}
                                  className="mr-1 inline h-3.5 w-3.5"
                                />
                                {t.categories.name}
                              </span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground">
                              Sin categoría
                            </span>
                          )}
                          {!t.categories?.name ? (
                            <SuggestRuleButton merchant={t.merchant} />
                          ) : null}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {t.cards
                            ? cardNameWithLast4(t.cards.name, t.cards.last4)
                            : "—"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {t.people?.name ?? "—"}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          {t.transaction_type === "payment" ? (
                            <Badge variant="secondary" className="mr-1">
                              Pago
                            </Badge>
                          ) : null}
                          {t.transaction_type === "income" ? (
                            <Badge variant="secondary" className="mr-1">
                              Ingreso
                            </Badge>
                          ) : null}
                          <span
                            className={
                              t.transaction_type === "refund" ||
                              t.transaction_type === "income"
                                ? "text-emerald-600"
                                : ""
                            }
                          >
                            {t.transaction_type === "refund" ||
                            t.transaction_type === "income"
                              ? "+"
                              : "-"}
                            {formatMoney(t.amount, t.currency)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-3 sm:hidden">
            {rows.map((t) => (
              <Card key={t.id}>
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-sm font-medium line-clamp-1">
                      {t.merchant ?? "Sin descripción"}
                    </CardTitle>
                    <span className="shrink-0 font-semibold">
                      {t.transaction_type === "refund" ||
                      t.transaction_type === "income"
                        ? "+"
                        : "-"}
                      {formatMoney(t.amount, t.currency)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0 text-sm text-muted-foreground">
                  <p>{formatDateTime(t.transaction_date, t.transaction_time)}</p>
                  <p className="mt-1 flex flex-wrap gap-1">
                    {t.transaction_type === "payment" ? (
                      <Badge variant="secondary">Pago de tarjeta</Badge>
                    ) : null}
                    {t.transaction_type === "income" ? (
                      <Badge variant="secondary">Ingreso</Badge>
                    ) : null}
                    <Badge variant="outline" className="gap-1.5">
                      {t.categories?.color ? (
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: t.categories.color }}
                        />
                      ) : null}
                      <CategoryIcon
                        name={t.categories?.icon}
                        className="h-3.5 w-3.5"
                      />
                      {t.categories?.name ?? "Sin categoría"}
                    </Badge>
                    {!t.categories?.name ? (
                      <SuggestRuleButton merchant={t.merchant} />
                    ) : null}
                    {t.cards ? <Badge variant="outline">{t.cards.name}</Badge> : null}
                    {t.people ? <Badge variant="outline">{t.people.name}</Badge> : null}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}