import { describe, expect, it } from "vitest";
import {
  detectInterbankPaymentMethod,
  detectInterbankTransactionType,
  interbankParser,
} from "@/lib/email/parsers/interbank";
import {
  interbankPagoEmail,
  interbankPagoExpected,
} from "@/tests/fixtures/emails";

describe("interbankParser", () => {
  it("identifica correos Interbank", () => {
    expect(interbankParser.canParse(interbankPagoEmail)).toBe(true);
  });

  it("reconoce la constancia de pago como payment", () => {
    const [parsed] = interbankParser.parse(interbankPagoEmail);
    expect(parsed.transactionType).toBe("payment");
  });

  it("no clasifica el pago como compra", () => {
    const [parsed] = interbankParser.parse(interbankPagoEmail);
    expect(parsed.transactionType).not.toBe("purchase");
  });

  it("parsea el pago completo", () => {
    expect(interbankParser.parse(interbankPagoEmail)).toEqual([
      interbankPagoExpected,
    ]);
  });

  it("extrae el código de operación", () => {
    const [parsed] = interbankParser.parse(interbankPagoEmail);
    expect(parsed.operationNumber).toBe("3317266");
  });

  it("detecta la fecha con mes en inglés corto", () => {
    const [parsed] = interbankParser.parse(interbankPagoEmail);
    expect(parsed.transactionDate).toBe("2026-07-13");
    expect(parsed.transactionTime).toBe("10:23");
  });

  it("detecta pago por la palabra clave", () => {
    expect(detectInterbankTransactionType("CONSTANCIA DE PAGO")).toBe(
      "payment",
    );
    expect(detectInterbankTransactionType("CONSUMO EN WONG")).toBe("purchase");
    expect(detectInterbankTransactionType("X")).toBe("other");
  });

  it("detecta el método de pago por la marca", () => {
    expect(detectInterbankPaymentMethod("CUENTA CARGO VISA SOLES")).toBe(
      "credit_card",
    );
    expect(detectInterbankPaymentMethod("CUENTA SOLES")).toBe("bank_account");
  });
});