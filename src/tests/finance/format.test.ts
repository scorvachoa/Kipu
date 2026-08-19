import { describe, expect, it } from "vitest";
import { formatMoney, formatMoneyMany, monthShortLabel } from "@/lib/format";

describe("formatMoneyMany", () => {
  it("formatea un total de una sola moneda", () => {
    expect(formatMoneyMany({ PEN: 123.5 })).toBe("S/ 123.50");
  });

  it("combina varias monedas separadas por +", () => {
    expect(formatMoneyMany({ PEN: 100, USD: 50 })).toBe("S/ 100.00 + $ 50.00");
  });

  it("ordena primero la moneda por defecto y luego por monto", () => {
    expect(formatMoneyMany({ USD: 200, PEN: 100, EUR: 50 })).toBe(
      "S/ 100.00 + $ 200.00 + € 50.00",
    );
  });

  it("ignora montos en cero", () => {
    expect(formatMoneyMany({ PEN: 0, USD: 0 })).toBe("S/ 0.00");
  });
});

describe("formatMoney", () => {
  it("formatea cada moneda con su símbolo", () => {
    expect(formatMoney(10, "USD")).toBe("$ 10.00");
    expect(formatMoney(10, "EUR")).toBe("€ 10.00");
    expect(formatMoney(10, "PEN")).toBe("S/ 10.00");
  });
});

describe("monthShortLabel", () => {
  it("devuelve la etiqueta corta del mes", () => {
    expect(monthShortLabel("2026-08")).toMatch(/ago/i);
  });
});