import { describe, expect, it } from "vitest";
import {
  detectAnomalies,
  detectSubscriptions,
  forecastMonthlyTotal,
  type SummaryTx,
} from "@/lib/finance/analysis";

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

describe("detectAnomalies", () => {
  it("detecta gasto muy superior al promedio del mismo comercio", () => {
    const rows = [
      tx({ id: "a", merchant: "NETFLIX", amount: 30 }),
      tx({ id: "b", merchant: "NETFLIX", amount: 35 }),
      tx({ id: "c", merchant: "NETFLIX", amount: 32 }),
      tx({ id: "d", merchant: "NETFLIX", amount: 140 }),
    ];
    const anomalies = detectAnomalies(rows);
    expect(anomalies).toHaveLength(1);
    expect(anomalies[0].transactionId).toBe("d");
    expect(anomalies[0].merchantMultiplier).toBeGreaterThan(4);
    expect(anomalies[0].severity).toBe("high");
  });

  it("no marca gastos dentro del rango normal", () => {
    const rows = [
      tx({ id: "a", merchant: "MARKET", amount: 100 }),
      tx({ id: "b", merchant: "MARKET", amount: 120 }),
      tx({ id: "c", merchant: "MARKET", amount: 110 }),
    ];
    expect(detectAnomalies(rows)).toHaveLength(0);
  });

  it("detecta anomalía por categoría cuando faltan suficientes muestras del comercio", () => {
    const rows = [
      tx({ id: "a", merchant: "REST A", amount: 80, categories: { name: "Cenas", icon: null } as never }),
      tx({ id: "b", merchant: "REST B", amount: 90, categories: { name: "Cenas", icon: null } as never }),
      tx({ id: "c", merchant: "REST C", amount: 85, categories: { name: "Cenas", icon: null } as never }),
      tx({ id: "d", merchant: "REST D", amount: 500, categories: { name: "Cenas", icon: null } as never }),
    ];
    const anomalies = detectAnomalies(rows);
    expect(anomalies).toHaveLength(1);
    expect(anomalies[0].transactionId).toBe("d");
    expect(anomalies[0].categoryName).toBe("Cenas");
  });

  it("ignora pagos y reembolsos", () => {
    const rows = [
      tx({ id: "a", merchant: "BANCO", amount: 30 }),
      tx({ id: "b", merchant: "BANCO", amount: 32 }),
      tx({ id: "c", merchant: "BANCO", amount: 31 }),
      tx({ id: "d", merchant: "BANCO", amount: 500, transaction_type: "payment" }),
    ];
    expect(detectAnomalies(rows)).toHaveLength(0);
  });
});

describe("detectSubscriptions", () => {
  it("detecta cargo recurrente mensual consistente", () => {
    const rows = [
      tx({ id: "a", merchant: "SPOTIFY", amount: 19.9, transaction_date: "2026-06-05" }),
      tx({ id: "b", merchant: "SPOTIFY", amount: 19.9, transaction_date: "2026-07-05" }),
      tx({ id: "c", merchant: "SPOTIFY", amount: 19.9, transaction_date: "2026-08-05" }),
    ];
    const subs = detectSubscriptions(rows);
    expect(subs).toHaveLength(1);
    expect(subs[0].merchant).toBe("SPOTIFY");
    expect(subs[0].avgAmount).toBe(19.9);
    expect(subs[0].occurrences).toBe(3);
    expect(subs[0].monthsActive).toBe(3);
  });

  it("no detecta montos variables aunque sean del mismo comercio", () => {
    const rows = [
      tx({ id: "a", merchant: "TIENDA", amount: 100, transaction_date: "2026-06-05" }),
      tx({ id: "b", merchant: "TIENDA", amount: 400, transaction_date: "2026-07-05" }),
      tx({ id: "c", merchant: "TIENDA", amount: 250, transaction_date: "2026-08-05" }),
    ];
    expect(detectSubscriptions(rows)).toHaveLength(0);
  });

  it("requiere mínimo dos ocurrencias", () => {
    const rows = [tx({ id: "a", merchant: "GYM", amount: 60 })];
    expect(detectSubscriptions(rows)).toHaveLength(0);
  });
});

describe("forecastMonthlyTotal", () => {
  it("proyecta el total del mes según ritmo", () => {
    const forecast = forecastMonthlyTotal({
      spentSoFar: 100,
      daysElapsed: 10,
      daysInMonth: 30,
      averageDailyPastMonths: 5,
    });
    expect(forecast.pacePerDay).toBe(7.5);
    expect(forecast.projected).toBe(250);
  });

  it("usa el ritmo diario actual si no hay histórico", () => {
    const forecast = forecastMonthlyTotal({
      spentSoFar: 150,
      daysElapsed: 15,
      daysInMonth: 30,
      averageDailyPastMonths: 0,
    });
    expect(forecast.projected).toBe(300);
    expect(forecast.pacePerDay).toBe(10);
  });

  it("no proyecta cuando el mes no ha empezado gastos", () => {
    const forecast = forecastMonthlyTotal({
      spentSoFar: 100,
      daysElapsed: 0,
      daysInMonth: 30,
      averageDailyPastMonths: 10,
    });
    expect(forecast.pacePerDay).toBe(5);
    expect(forecast.projected).toBe(250);
  });
});