import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  listTransactions,
  type TransactionFilters,
} from "@/lib/supabase/queries";
import { error } from "@/lib/http";
import type { SummaryTx } from "@/lib/finance/summary";

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, string> = {
  purchase: "Compra",
  payment: "Pago de tarjeta",
  transfer: "Transferencia",
  withdrawal: "Retiro",
  refund: "Reembolso",
  fee: "Comisión",
  income: "Ingreso",
  other: "Otro",
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  credit_card: "Tarjeta de crédito",
  debit_card: "Tarjeta de débito",
  bank_account: "Cuenta",
  unknown: "Desconocido",
};

function readParam(
  url: URL,
  key: string,
): string | undefined {
  const value = url.searchParams.get(key);
  return value && value.trim() !== "" ? value : undefined;
}

function escapeCsv(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? "" : String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function toCsv(rows: SummaryTx[]): string {
  const header = [
    "Fecha",
    "Hora",
    "Comercio",
    "Banco",
    "Categoría",
    "Tarjeta",
    "Persona",
    "Tipo",
    "Método de pago",
    "Monto",
    "Moneda",
    "Estado",
  ];
  const lines = rows.map((tx) =>
    [
      escapeCsv(tx.transaction_date),
      escapeCsv(tx.transaction_time),
      escapeCsv(tx.merchant),
      escapeCsv(tx.cards?.bank),
      escapeCsv(tx.categories?.name),
      escapeCsv(tx.cards ? `${tx.cards.name}${tx.cards.last4 ? ` (****${tx.cards.last4})` : ""}` : null),
      escapeCsv(tx.people?.name),
      escapeCsv(TYPE_LABELS[tx.transaction_type] ?? tx.transaction_type),
      escapeCsv(PAYMENT_METHOD_LABELS[tx.payment_method] ?? tx.payment_method),
      escapeCsv(tx.amount),
      escapeCsv(tx.currency),
      escapeCsv(tx.status),
    ].join(","),
  );
  return [header.join(","), ...lines].join("\r\n");
}

export async function GET(request: Request) {
  const user = await getUser();
  if (!user) {
    return error("No autorizado", 401);
  }

  const url = new URL(request.url);
  const filters: TransactionFilters = {
    monthKey: readParam(url, "month"),
    bank: readParam(url, "bank"),
    cardId: readParam(url, "card"),
    personId: readParam(url, "person"),
    categoryId: readParam(url, "category"),
    transactionType: readParam(url, "type"),
    search: readParam(url, "q"),
  };

  const supabase = await createClient();
  let rows: SummaryTx[];
  try {
    rows = await listTransactions(supabase, user.id, filters, { limit: 20000 });
  } catch (dbError) {
    console.error("GET /api/transactions/export:", (dbError as Error).message);
    return error("Error al exportar transacciones", 500);
  }

  const csv = toCsv(rows);
  const monthLabel = filters.monthKey ?? "todos";
  const filename = `kipu-transacciones-${monthLabel}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}