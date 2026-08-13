import { describe, expect, it } from "vitest";
import {
  fallbackFingerprint,
  operationFingerprint,
} from "@/lib/email/deduplication";

describe("operationFingerprint", () => {
  it("compone banco y número de operación", () => {
    expect(operationFingerprint("BCP", "045171")).toBe("BCP:045171");
    expect(operationFingerprint("INTERBANK", "3317266")).toBe(
      "INTERBANK:3317266",
    );
  });

  it("distingue bancos con la misma operación", () => {
    expect(operationFingerprint("BCP", "045171")).not.toBe(
      operationFingerprint("INTERBANK", "045171"),
    );
  });
});

describe("fallbackFingerprint", () => {
  const base = {
    bank: "BCP" as const,
    cardLast4: "8795",
    transactionDate: "2026-08-07",
    amount: 11.08,
    merchant: "MARKET MARY",
  };

  it("es estable para la misma transacción", () => {
    expect(fallbackFingerprint(base)).toBe(fallbackFingerprint(base));
  });

  it("difiere si cambia el monto", () => {
    expect(fallbackFingerprint(base)).not.toBe(
      fallbackFingerprint({ ...base, amount: 11.09 }),
    );
  });

  it("difiere si cambia la tarjeta", () => {
    expect(fallbackFingerprint(base)).not.toBe(
      fallbackFingerprint({ ...base, cardLast4: "4321" }),
    );
  });
});