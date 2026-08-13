import { describe, expect, it } from "vitest";
import { normalizeMerchant, merchantMatches } from "@/lib/email/merchant";

describe("normalizeMerchant", () => {
  it("convierte a mayúsculas y elimina ruido del prefijo", () => {
    expect(normalizeMerchant("OP *Market Mary")).toBe("MARKET MARY");
  });

  it("colapsa espacios innecesarios", () => {
    expect(normalizeMerchant("  Wong   Perú  ")).toBe("WONG PERU");
  });

  it("normaliza caracteres acentuados", () => {
    expect(normalizeMerchant("Tottús Ávila")).toBe("TOTTUS AVILA");
  });

  it("devuelve undefined para valores vacíos", () => {
    expect(normalizeMerchant(undefined)).toBeUndefined();
    expect(normalizeMerchant("")).toBeUndefined();
  });

  it("conserva comercios tipo IO sin inventar datos", () => {
    expect(normalizeMerchant("IO*first_last_name_firs")).toBe(
      "IO FIRST LAST NAME FIRS",
    );
  });
});

describe("merchantMatches", () => {
  it("coincide como subcadena", () => {
    expect(merchantMatches("MARKET MARY", "MARKET MARY")).toBe(true);
    expect(merchantMatches("MARKET", "MARKET MARY")).toBe(true);
    expect(merchantMatches("UBER", "MARKET MARY")).toBe(false);
  });
});