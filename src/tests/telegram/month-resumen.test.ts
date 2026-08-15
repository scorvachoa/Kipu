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
    totalExpenses: 0,
    transactionCount: 0,
    creditExpenses: 0,
    debitExpenses: 0,
    cardPayments: 0,
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