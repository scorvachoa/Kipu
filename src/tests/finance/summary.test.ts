import { describe, expect, it } from "vitest";
import {
  aggregateMonthSummary,
  currentMonthKey,
  isValidMonthKey,
  monthKeyToRange,
  monthLabel,
  type SummaryTx,
} from "@/lib/finance/summary";

function tx(partial: Partial<SummaryTx>): SummaryTx {
  return {
    id: "tx",
    amount: 100,
    currency: "PEN",
    transaction_type: "purchase",
    payment_method: "debit_card",
    merchant: "Market",
    transaction_date: "2026-08-01",
    transaction_time: "12:00",
    status: "confirmed",
    categories: null,
    cards: null,
    people: null,
    ...partial,
  };
}

describe("aggregateMonthSummary", () => {
  it("suma gastos y cuenta transacciones", () => {
    const rows = [
      tx({ amount: 50 }),
      tx({ amount: 30, payment_method: "credit_card" }),
      tx({ amount: 20, transaction_type: "payment" }),
    ];
    const summary = aggregateMonthSummary(rows, "2026-08");
    expect(summary.totalExpenses).toBe(80);
    expect(summary.transactionCount).toBe(2);
    expect(summary.debitExpenses).toBe(50);
    expect(summary.creditExpenses).toBe(30);
    expect(summary.cardPayments).toBe(20);
  });

  it("no cuenta pagos de tarjeta como gastos", () => {
    const rows = [tx({ amount: 500, transaction_type: "payment" })];
    const summary = aggregateMonthSummary(rows, "2026-08");
    expect(summary.totalExpenses).toBe(0);
    expect(summary.transactionCount).toBe(0);
    expect(summary.cardPayments).toBe(500);
  });

  it("agrupa por categoría y por tarjeta, ordenando descendentemente", () => {
    const rows = [
      tx({
        amount: 40,
        merchant: "Rappi",
        categories: { name: "Comida", icon: "🍔" },
        cards: { name: "BCP Visa", bank: "BCP", last4: "1234" },
      }),
      tx({
        amount: 60,
        merchant: "Tiendas",
        categories: { name: "Otros", icon: "🛍️" },
        cards: { name: "Interbank Visa", bank: "INTERBANK", last4: "4321" },
      }),
      tx({
        amount: 10,
        merchant: "Sin categoria",
        categories: null,
        cards: { name: "BCP Visa", bank: "BCP", last4: "1234" },
      }),
    ];
    const summary = aggregateMonthSummary(rows, "2026-08");
    expect(summary.categoryBreakdown.map((c) => [c.name, c.total])).toEqual([
      ["Otros", 60],
      ["Comida", 40],
      ["Sin categoría", 10],
    ]);
    expect(summary.cardBreakdown.map((c) => [c.name, c.total])).toEqual([
      ["Interbank Visa", 60],
      ["BCP Visa", 50],
    ]);
  });

  it("construye la lista de recientes ordenada por fecha y hora", () => {
    const rows = [
      tx({ id: "a", transaction_date: "2026-08-01", transaction_time: "10:00" }),
      tx({ id: "b", transaction_date: "2026-08-03", transaction_time: "09:00" }),
      tx({ id: "c", transaction_date: "2026-08-03", transaction_time: "18:00" }),
    ];
    const summary = aggregateMonthSummary(rows, "2026-08");
    expect(summary.latest.map((t) => t.id)).toEqual(["c", "b", "a"]);
  });

  it("limita los recientes a 10", () => {
    const rows = Array.from({ length: 15 }, (_, i) =>
      tx({ id: `t${i}`, transaction_date: `2026-08-${String((i % 28) + 1).padStart(2, "0")}`, transaction_time: `10:${i}` }),
    );
    const summary = aggregateMonthSummary(rows, "2026-08");
    expect(summary.latest).toHaveLength(10);
  });
});

describe("monthKeyToRange", () => {
  it("calcula el rango del mes", () => {
    expect(monthKeyToRange("2026-08")).toEqual({ gte: "2026-08-01", lt: "2026-09-01" });
    expect(monthKeyToRange("2026-12")).toEqual({ gte: "2026-12-01", lt: "2027-01-01" });
  });
});

describe("helpers de mes", () => {
  it("valida claves de mes", () => {
    expect(isValidMonthKey("2026-08")).toBe(true);
    expect(isValidMonthKey(undefined)).toBe(false);
    expect(isValidMonthKey("2026-13")).toBe(true);
    expect(isValidMonthKey("2026-8")).toBe(false);
  });

  it("obtiene la clave del mes actual en formato YYYY-MM", () => {
    expect(currentMonthKey()).toMatch(/^\d{4}-\d{2}$/);
  });

  it("formatea la etiqueta del mes", () => {
    expect(monthLabel("2026-08")).toMatch(/agosto/i);
  });
});