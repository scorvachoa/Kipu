import { describe, expect, it } from "vitest";
import {
  aggregateMonthSummary,
  currentMonthKey,
  isValidMonthKey,
  monthKeyToRange,
  monthLabel,
  previousMonthKeys,
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
        categories: { name: "Comida", icon: "🍔", color: null },
        cards: { name: "BCP Visa", bank: "BCP", last4: "1234" },
      }),
      tx({
        amount: 60,
        merchant: "Tiendas",
        categories: { name: "Otros", icon: "🛍️", color: null },
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

  it("desglosa los totales por moneda", () => {
    const rows = [
      tx({ amount: 100, currency: "PEN", payment_method: "debit_card" }),
      tx({ amount: 50, currency: "USD", payment_method: "credit_card" }),
      tx({ amount: 30, currency: "PEN", transaction_type: "payment" }),
    ];
    const summary = aggregateMonthSummary(rows, "2026-08");
    expect(summary.baseCurrency).toBe("PEN");
    expect(summary.totalExpenses).toBe(100);
    expect(summary.totalExpensesByCurrency).toEqual({ PEN: 100, USD: 50 });
    expect(summary.debitExpensesByCurrency).toEqual({ PEN: 100 });
    expect(summary.creditExpensesByCurrency).toEqual({ USD: 50 });
    expect(summary.cardPaymentsByCurrency).toEqual({ PEN: 30 });
  });

  it("elige como moneda base la más usada", () => {
    const rows = [
      tx({ amount: 10, currency: "PEN" }),
      tx({ amount: 20, currency: "USD" }),
      tx({ amount: 30, currency: "USD" }),
    ];
    const summary = aggregateMonthSummary(rows, "2026-08");
    expect(summary.baseCurrency).toBe("USD");
    expect(summary.totalExpensesByCurrency).toEqual({ PEN: 10, USD: 50 });
    expect(summary.totalExpenses).toBe(50);
  });

  it("agrupa categorías y tarjetas por moneda", () => {
    const rows = [
      tx({
        amount: 40,
        currency: "PEN",
        categories: { name: "Comida", icon: "🍔", color: null },
        cards: { name: "BCP Visa", bank: "BCP", last4: "1234" },
      }),
      tx({
        amount: 20,
        currency: "USD",
        categories: { name: "Comida", icon: "🍔", color: null },
        cards: { name: "BCP Visa", bank: "BCP", last4: "1234" },
      }),
    ];
    const summary = aggregateMonthSummary(rows, "2026-08");
    expect(summary.categoryBreakdown.map((c) => [c.name, c.currency, c.total])).toEqual([
      ["Comida", "PEN", 40],
      ["Comida", "USD", 20],
    ]);
    expect(summary.cardBreakdown.map((c) => [c.name, c.currency, c.total])).toEqual([
      ["BCP Visa", "PEN", 40],
      ["BCP Visa", "USD", 20],
    ]);
  });

  it("suma ingresos y reembolsos por separado de los gastos", () => {
    const rows = [
      tx({ amount: 100, transaction_type: "purchase" }),
      tx({ amount: 200, transaction_type: "income" }),
      tx({ amount: 50, transaction_type: "refund", currency: "USD" }),
    ];
    const summary = aggregateMonthSummary(rows, "2026-08");
    expect(summary.totalExpenses).toBe(100);
    expect(summary.transactionCount).toBe(1);
    expect(summary.totalIncome).toBe(200);
    expect(summary.totalIncomeByCurrency).toEqual({ PEN: 200, USD: 50 });
    expect(summary.netBalance).toBe(100);
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

  it("calcula los meses anteriores a una clave", () => {
    expect(previousMonthKeys("2026-08", 3)).toEqual([
      "2026-08",
      "2026-07",
      "2026-06",
    ]);
    expect(previousMonthKeys("2026-01", 2)).toEqual(["2026-01", "2025-12"]);
    expect(previousMonthKeys("2026-08")).toHaveLength(6);
  });

  it("rechaza claves de mes inválidas en previousMonthKeys", () => {
    expect(() => previousMonthKeys("abc-def", 2)).toThrow();
  });
});