import { describe, expect, it } from "vitest";
import {
  formatCardBreakdown,
  formatCategoriesBreakdown,
  formatMonthSummary,
  formatRecentExpenses,
  formatTransactionNotification,
} from "@/lib/telegram/messages";
import type { MonthSummary } from "@/lib/finance/summary";

describe("formatTransactionNotification", () => {
  it("formatea un gasto", () => {
    const text = formatTransactionNotification({
      bank: "BCP",
      merchant: "Market Mary",
      amount: 11.08,
      currency: "PEN",
      transaction_type: "purchase",
      transaction_date: "2026-08-07",
      transaction_time: "19:38:00",
      status: "confirmed",
      card_label: "Débito ****8795",
      person_name: "Yo",
      category_name: "Alimentación",
      category_icon: "Utensils",
    });

    expect(text).toContain("💳 NUEVO GASTO");
    expect(text).toContain("🏦 BCP");
    expect(text).toContain("🏪 Market Mary");
    expect(text).toContain("S/ 11.08");
    expect(text).toContain("💳 Débito ****8795");
    expect(text).toContain("👤 Yo");
    expect(text).toContain("🍔 Alimentación");
    expect(text).toContain("📅 07/08/2026 19:38");
  });

  it("distingue un pago", () => {
    const text = formatTransactionNotification({
      bank: "Interbank",
      merchant: "PagoEfectivo",
      amount: 200,
      currency: "PEN",
      transaction_type: "payment",
      transaction_date: "2026-08-07",
      transaction_time: null,
      status: "confirmed",
      card_label: null,
      person_name: null,
      category_name: null,
      category_icon: null,
    });

    expect(text).toContain("💵 NUEVO PAGO");
    expect(text).toContain("🏦 Interbank");
    expect(text).not.toContain("NUEVO GASTO");
  });

  it("marca transacciones que requieren revisión", () => {
    const text = formatTransactionNotification({
      bank: "BCP",
      merchant: null,
      amount: 15,
      currency: "PEN",
      transaction_type: "purchase",
      transaction_date: "2026-08-08",
      transaction_time: "10:00:00",
      status: "needs_review",
      card_label: null,
      person_name: null,
      category_name: null,
      category_icon: null,
    });

    expect(text).toContain("⚠️ NUEVO GASTO");
    expect(text).toContain("Corrige la transacción");
  });
});

function sampleSummary(): MonthSummary {
  return {
    monthKey: "2026-08",
    totalExpenses: 4280.5,
    transactionCount: 12,
    creditExpenses: 2150.5,
    debitExpenses: 2130,
    cardPayments: 0,
    categoryBreakdown: [
      { name: "Alimentación", icon: "Utensils", total: 1250 },
      { name: "Transporte", icon: "Car", total: 430 },
    ],
    cardBreakdown: [
      { name: "BCP Débito", bank: "BCP", last4: "8795", total: 1240.5 },
    ],
    latest: [],
  };
}

describe("formatMonthSummary", () => {
  it("muestra totales y categorías principales", () => {
    const text = formatMonthSummary(sampleSummary());

    expect(text).toContain("📊 Kipu — agosto de 2026");
    expect(text).toContain("💰 Gastos:");
    expect(text).toContain("S/ 4,280.50");
    expect(text).toContain("🍔 Alimentación:");
  });
});

describe("formatRecentExpenses", () => {
  it("lista los gastos", () => {
    const text = formatRecentExpenses([
      {
        transaction_date: "2026-08-12",
        transaction_time: null,
        merchant: "Wong",
        amount: 87.5,
        currency: "PEN",
        category_name: "Alimentación",
        category_icon: "Utensils",
        card_label: "BCP ****8795",
      },
    ]);

    expect(text).toContain("💳 Últimos gastos");
    expect(text).toContain("Wong");
    expect(text).toContain("S/ 87.50");
  });
});

describe("formatCardBreakdown", () => {
  it("formatea tarjetas", () => {
    const text = formatCardBreakdown([
      { name: "BCP Débito", bank: "BCP", last4: "8795", total: 1240.5 },
    ]);

    expect(text).toContain("💳 Mis tarjetas");
    expect(text).toContain("BCP Débito ****8795");
    expect(text).toContain("S/ 1,240.50");
  });
});

describe("formatCategoriesBreakdown", () => {
  it("formatea categorías", () => {
    const text = formatCategoriesBreakdown([
      { name: "Alimentación", icon: "Utensils", total: 1250 },
    ]);

    expect(text).toContain("📁 Gastos por categoría");
    expect(text).toContain("🍔 Alimentación:");
    expect(text).toContain("S/ 1,250.00");
  });
});