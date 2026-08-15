import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  senderMatchesKnownBank,
  shouldAttemptAiParse,
  validateExtraction,
} from "@/lib/email/parsers/ai-catchall";
import type { EmailEnvelope } from "@/lib/email/bank-email-parser";

afterEach(() => {
  vi.unstubAllEnvs();
});

const BBVA_CONSUMO_HTML = `<!DOCTYPE html>
<html>
<body>
<p>Realizaste una compra de US$ 25.50 con tu tarjeta de crédito BBVA.</p>
<table>
<tr><td>Fecha y hora</td><td>15 de agosto de 2026 - 07:38 PM</td></tr>
<tr><td>Empresa</td><td>NETFLIX.COM</td></tr>
<tr><td>Tarjeta</td><td>************4521</td></tr>
<tr><td>Número de operación</td><td>881234</td></tr>
</table>
</body>
</html>`;

function makeEmail(overrides: Partial<EmailEnvelope>): EmailEnvelope {
  return {
    id: "e1",
    threadId: "t1",
    internalDate: "1783470300000",
    from: "BBVA <noreply@bbva.com.pe>",
    subject: "Compra con tu tarjeta",
    html: BBVA_CONSUMO_HTML,
    ...overrides,
  };
}

describe("senderMatchesKnownBank", () => {
  it("reconoce dominios de la mega lista", () => {
    expect(
      senderMatchesKnownBank("Notificaciones <noreply@cajaarequipa.pe>"),
    ).toBe(true);
    expect(senderMatchesKnownBank("PayPal <noreply@paypal.com>")).toBe(true);
    expect(senderMatchesKnownBank("iO <notificaciones@io.pe>")).toBe(true);
  });

  it("rechaza remitentes fuera de la lista", () => {
    expect(senderMatchesKnownBank("Boletin <hola@random.spam.com>")).toBe(
      false,
    );
  });
});

describe("shouldAttemptAiParse", () => {
  beforeEach(() => {
    vi.stubEnv("GROQ_API_KEY", "test-key");
  });

  it("acepta un correo de banco peruano con monto y clave transaccional", () => {
    expect(shouldAttemptAiParse(makeEmail({}))).toBe(true);
  });

  it("acepta un correo de iO (BCP IO) de pago de servicio", () => {
    const email = makeEmail({
      id: "io-1",
      from: "iO Notificaciones <notificaciones@io.pe>",
      subject: "El pago de tu servicio se realizó de manera exitosa",
      html: "<p>Tu pago de S/ 49.90 por el servicio iO fue exitoso.</p>",
    });
    expect(shouldAttemptAiParse(email)).toBe(true);
  });

  it("rechaza correos sin monto detectable", () => {
    const email = makeEmail({
      html: "<p>Gracias por contratar nuestro seguro de salud.</p>",
    });
    expect(shouldAttemptAiParse(email)).toBe(false);
  });

  it("rechaza correos de marketing aunque tengan monto", () => {
    const email = makeEmail({
      subject: "Promoción exclusiva: 50% de cashback",
      html: "<p>Con tu tarjeta obtén hasta S/ 200 de cashback este mes.</p>",
    });
    expect(shouldAttemptAiParse(email)).toBe(false);
  });
});

describe("validateExtraction", () => {
  it("normaliza un extracción completa", () => {
    const result = validateExtraction({
      bank: "BBVA Continental",
      amount: 25.5,
      currency: "USD",
      transactionDate: "2026-08-15",
      transactionTime: "19:38",
      merchant: "NETFLIX.COM",
      cardLast4: "4521",
      transactionType: "purchase",
      paymentMethod: "credit_card",
      operationNumber: "881234",
    });
    expect(result).toEqual({
      bank: "BBVA",
      transactionType: "purchase",
      paymentMethod: "credit_card",
      amount: 25.5,
      currency: "USD",
      transactionDate: "2026-08-15",
      transactionTime: "19:38",
      merchant: "NETFLIX.COM",
      cardLast4: "4521",
      operationNumber: "881234",
    });
  });

  it("devuelve null sin monto válido", () => {
    expect(
      validateExtraction({
        bank: "BBVA",
        amount: 0,
        currency: "PEN",
        transactionDate: "2026-08-15",
        transactionType: "other",
      }),
    ).toBeNull();
  });

  it("devuelve null sin fecha válida", () => {
    expect(
      validateExtraction({
        bank: "BBVA",
        amount: 10,
        currency: "PEN",
        transactionDate: "15/08/2026",
        transactionType: "purchase",
      }),
    ).toBeNull();
  });

  it("normaliza banco y métodos mediante alias", () => {
    const result = validateExtraction({
      bank: "BANCO DE CREDITO DEL PERU",
      amount: 11.08,
      currency: "S/",
      transactionDate: "2026-08-07",
      transactionType: "compra",
      paymentMethod: "tarjeta de débito",
    });
    expect(result).toMatchObject({
      bank: "BCP",
      amount: 11.08,
      currency: "PEN",
      transactionType: "purchase",
      paymentMethod: "debit_card",
    });
  });

  it("mapea Yape como banco y método desconocido queda 'unknown'", () => {
    const result = validateExtraction({
      bank: "yape",
      amount: 15,
      currency: "PEN",
      transactionDate: "2026-08-10",
      transactionType: "income",
      paymentMethod: "app movil",
    });
    expect(result).toMatchObject({
      bank: "YAPE",
      transactionType: "income",
      paymentMethod: "unknown",
    });
  });

  it("mapea iO (BCP IO) como banco BCP IO", () => {
    const result = validateExtraction({
      bank: "iO",
      amount: 49.9,
      currency: "PEN",
      transactionDate: "2026-08-14",
      transactionType: "payment",
      paymentMethod: "bank_account",
    });
    expect(result).toMatchObject({
      bank: "BCP IO",
      transactionType: "payment",
      paymentMethod: "bank_account",
    });
  });
});