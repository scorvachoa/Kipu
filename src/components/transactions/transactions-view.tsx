"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Download, Search, X } from "lucide-react";
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

function SuggestRuleButton({
  merchant,
  transactionId,
  onApplied,
}: {
  merchant: string | null;
  transactionId?: string;
  onApplied?: () => void;
}) {
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
            body: JSON.stringify({ merchant, transactionId }),
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
          onApplied?.();
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

function PaginationControls({
  page,
  pageSize,
  totalPages,
  total,
  start,
  pageSizeOptions,
  pageItems,
  onChangePage,
  onChangeSize,
  showSize = true,
  showPager = true,
}: {
  page: number;
  pageSize: number;
  totalPages: number;
  total: number;
  start: number;
  pageSizeOptions: string[];
  pageItems: Array<number | "…">;
  onChangePage: (page: number) => void;
  onChangeSize: (size: string) => void;
  showSize?: boolean;
  showPager?: boolean;
}) {
  return (
    <div
      className={`flex flex-wrap items-center gap-3 ${
        showPager ? "justify-between" : "justify-end"
      }`}
    >
      {showPager ? (
        <p className="text-xs text-muted-foreground">
          Mostrando{" "}
          <span className="font-medium text-foreground">
            {total === 0 ? 0 : start + 1}–
            {Math.min(start + pageSize, total)}
          </span>{" "}
          de <span className="font-medium text-foreground">{total}</span>
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        {showSize ? (
          <Select
            value={String(pageSize)}
            onValueChange={(size) => onChangeSize(size)}
          >
            <SelectTrigger className="h-9 w-[110px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option} filas
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
        {showPager ? (
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page <= 1}
              onClick={() => onChangePage(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {pageItems.map((item, index) =>
              item === "…" ? (
                <span
                  key={`ellipsis-${index}`}
                  className="px-1 text-xs text-muted-foreground"
                >
                  …
                </span>
              ) : (
                <Button
                  key={item}
                  variant={item === page ? "default" : "outline"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onChangePage(item)}
                >
                  {item}
                </Button>
              ),
            )}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page >= totalPages}
              onClick={() => onChangePage(page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        ) : null}
      </div>
    </div>
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

  const [exporting, setExporting] = useState(false);

  async function exportCsv() {
    setExporting(true);
    try {
      const params = new URLSearchParams(searchParams.toString());
      const res = await fetch(`/api/transactions/export?${params.toString()}`);
      if (!res.ok) {
        return;
      }
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = "kipu-transacciones.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } finally {
      setExporting(false);
    }
  }

  const update = useCallback(
    (key: string, value: string, resetPage = true) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      if (resetPage && key !== "page") {
        params.delete("page");
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

  const pageSizeOptions = ["10", "20", "50", "100"];
  const rawPageSize = searchParams.get("size") ?? "";
  const pageSize = pageSizeOptions.includes(rawPageSize)
    ? Number(rawPageSize)
    : 10;
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const rawPage = Number(searchParams.get("page") ?? "1");
  const page =
    Number.isFinite(rawPage) && rawPage >= 1
      ? Math.min(Math.floor(rawPage), totalPages)
      : 1;
  const start = (page - 1) * pageSize;
  const pageRows = rows.slice(start, start + pageSize);

  function pageItems(): Array<number | "…"> {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const items: Array<number | "…"> = [1];
    const startWindow = Math.max(2, page - 1);
    const endWindow = Math.min(totalPages - 1, page + 1);
    if (startWindow > 2) {
      items.push("…");
    }
    for (let p = startWindow; p <= endWindow; p++) {
      items.push(p);
    }
    if (endWindow < totalPages - 1) {
      items.push("…");
    }
    items.push(totalPages);
    return items;
  }

  const showPagination = pageRows.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Transacciones</h1>
          <p className="text-sm text-muted-foreground">{rows.length} movimientos</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCsv} disabled={exporting}>
          <Download className="h-4 w-4" />
          {exporting ? "Exportando…" : "Exportar CSV"}
        </Button>
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
          {showPagination ? (
            <PaginationControls
              page={page}
              pageSize={pageSize}
              totalPages={totalPages}
              total={rows.length}
              start={start}
              pageSizeOptions={pageSizeOptions}
              pageItems={pageItems()}
              onChangePage={(next) => update("page", String(next))}
              onChangeSize={(size) => update("size", size)}
              showPager={false}
            />
          ) : null}
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
                    {pageRows.map((t) => (
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
                            <SuggestRuleButton
                              merchant={t.merchant}
                              transactionId={t.id}
                              onApplied={() => router.refresh()}
                            />
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
            {pageRows.map((t) => (
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
                      <SuggestRuleButton
                        merchant={t.merchant}
                        transactionId={t.id}
                        onApplied={() => router.refresh()}
                      />
                    ) : null}
                    {t.cards ? <Badge variant="outline">{t.cards.name}</Badge> : null}
                    {t.people ? <Badge variant="outline">{t.people.name}</Badge> : null}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {showPagination ? (
            <PaginationControls
              page={page}
              pageSize={pageSize}
              totalPages={totalPages}
              total={rows.length}
              start={start}
              pageSizeOptions={pageSizeOptions}
              pageItems={pageItems()}
              onChangePage={(next) => update("page", String(next))}
              onChangeSize={(size) => update("size", size)}
              showSize={false}
            />
          ) : null}
        </>
      )}
    </div>
  );
}