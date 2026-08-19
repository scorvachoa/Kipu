import { afterEach, describe, expect, it } from "vitest";
import { resumenMensualConGemini } from "@/lib/ai/month-resumen";
import type { MonthSummary } from "@/lib/finance/summary";

const originalKey = process.env.GOOGLE_AI_API_KEY;

afterEach(() => {
  if (originalKey === undefined) {
    delete process.env.GOOGLE_AI_API_KEY;
  } else {
    process.env.GOOGLE_AI_API_KEY = originalKey;
  }
});

function emptySummary(): MonthSummary {
  return {
    monthKey: "2026-07",
    baseCurrency: "PEN",
    totalExpenses: 0,
    totalExpensesByCurrency: {},
    totalIncome: 0,
    totalIncomeByCurrency: {},
    netBalance: 0,
    transactionCount: 0,
    creditExpenses: 0,
    creditExpensesByCurrency: {},
    debitExpenses: 0,
    debitExpensesByCurrency: {},
    cardPayments: 0,
    cardPaymentsByCurrency: {},
    categoryBreakdown: [],
    cardBreakdown: [],
    latest: [],
  };
}

describe("resumenMensualConGemini", () => {
  it("devuelve null sin GOOGLE_AI_API_KEY (sin llamar a la API)", async () => {
    delete process.env.GOOGLE_AI_API_KEY;
    const result = await resumenMensualConGemini(emptySummary());
    expect(result).toBeNull();
  });
});