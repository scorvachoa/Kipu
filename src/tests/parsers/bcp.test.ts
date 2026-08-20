import { describe, expect, it } from "vitest";
import type { EmailEnvelope } from "@/lib/email/bank-email-parser";
import { bcpParser } from "@/lib/email/parsers/bcp";
import {
  bcpConsumoEmail,
  bcpConsumoExpected,
  bcpSegundoConsumoEmail,
  bcpSegundoConsumoExpected,
} from "@/tests/fixtures/emails";

describe("bcpParser", () => {
  it("identifica correos BCP", () => {
    expect(bcpParser.canParse(bcpConsumoEmail)).toBe(true);
  });

  it("parsea el consumo correctamente", () => {
    expect(bcpParser.parse(bcpConsumoEmail)).toEqual([bcpConsumoExpected]);
  });

  it("extrae el monto correcto", () => {
    const [parsed] = bcpParser.parse(bcpConsumoEmail);
    expect(parsed.amount).toBe(11.08);
  });

  it("extrae la fecha correcta", () => {
    const [parsed] = bcpParser.parse(bcpConsumoEmail);
    expect(parsed.transactionDate).toBe("2026-08-07");
    expect(parsed.transactionTime).toBe("19:38");
  });

  it("extrae la tarjeta correcta", () => {
    const [parsed] = bcpParser.parse(bcpConsumoEmail);
    expect(parsed.cardLast4).toBe("8795");
  });

  it("extrae el número de operación correcto", () => {
    const [parsed] = bcpParser.parse(bcpConsumoEmail);
    expect(parsed.operationNumber).toBe("045171");
  });

  it("parsea el segundo consumo", () => {
    expect(bcpParser.parse(bcpSegundoConsumoEmail)).toEqual([
      bcpSegundoConsumoExpected,
    ]);
  });

  it("convierte la hora AM correctamente", () => {
    const [parsed] = bcpParser.parse(bcpSegundoConsumoEmail);
    expect(parsed.transactionTime).toBe("06:44");
  });

  it("no parsea correos de otro banco", () => {
    const email = { ...bcpConsumoEmail, from: "otro@example.com", subject: "" };
    expect(bcpParser.canParse(email)).toBe(false);
  });

  it("devuelve vacío si falta monto o fecha", () => {
    const email = {
      ...bcpConsumoEmail,
      html: "<html><body><p>Formato desconocido</p></body></html>",
    };
    expect(bcpParser.parse(email)).toEqual([]);
  });

  it("usa el asunto como fallback del comercio", () => {
    const email: EmailEnvelope = {
      ...bcpConsumoEmail,
      subject: "Consumo por S/ 50.00 en NETFLIX.COM",
      html: `<html><body><p>Realizaste un consumo de S/ 50.00.</p>
        <table>
        <tr><td>Total del consumo</td><td>S/ 50.00</td></tr>
        <tr><td>Fecha y hora</td><td>07 de agosto de 2026 - 07:38 PM</td></tr>
        <tr><td>Número de Tarjeta de Débito</td><td>************8795</td></tr>
        </table></body></html>`,
    };
    const [parsed] = bcpParser.parse(email);
    expect(parsed.merchant).toBe("NETFLIX.COM");
  });

  it("extrae la tarjeta de una máscara dentro de un fragmento con texto", () => {
    const email: EmailEnvelope = {
      ...bcpConsumoEmail,
      html: `<html><body><p>Consumo OK</p>
        <table>
        <tr><td>Total del consumo</td><td>S/ 11.08</td></tr>
        <tr><td>Fecha y hora</td><td>07 de agosto de 2026 - 07:38 PM</td></tr>
        <tr><td>Detalle de Tarjeta</td><td>Tu Tarjeta de Débito ************8795 terminó</td></tr>
        <tr><td>Empresa</td><td>OP *Market Mary</td></tr>
        </table></body></html>`,
    };
    const [parsed] = bcpParser.parse(email);
    expect(parsed.cardLast4).toBe("8795");
  });
});