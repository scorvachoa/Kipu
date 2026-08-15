import { describe, expect, it } from "vitest";
import {
  extractGreetingName,
  titleCaseName,
} from "@/lib/email/person-name";
import type { EmailEnvelope } from "@/lib/email/bank-email-parser";

function email(overrides: Partial<EmailEnvelope>): EmailEnvelope {
  return {
    id: "1",
    threadId: "1",
    internalDate: "0",
    from: "BCP <noreply@bcp.com.pe>",
    subject: "",
    html: "",
    ...overrides,
  };
}

describe("extractGreetingName", () => {
  it("extrae el nombre tras 'Hola' en el cuerpo BCP", () => {
    const result = extractGreetingName(
      email({
        html: "<p>Hola SMITH, ¡Tu operación se realizó con éxito!</p>",
      }),
    );
    expect(result).toBe("Smith");
  });

  it("extrae 'Hola, Smith' con coma tras el saludo", () => {
    const result = extractGreetingName(
      email({ html: "<p>Hola, Smith. Tienes un movimiento nuevo.</p>" }),
    );
    expect(result).toBe("Smith");
  });

  it("extrae el nombre inicial seguido de coma tipo Interbank", () => {
    const result = extractGreetingName(
      email({
        subject: "Smith, realizaste un consumo con tu Tarjeta Interbank",
        html: "<div>Smith, realizaste un consumo con tu Tarjeta Interbank</div>",
      }),
    );
    expect(result).toBe("Smith");
  });

  it("ignora saludos genéricos", () => {
    expect(
      extractGreetingName(email({ html: "<p>Hola Usuario!</p>" })),
    ).toBeUndefined();
    expect(
      extractGreetingName(email({ html: "<p>Hola Cliente!</p>" })),
    ).toBeUndefined();
    expect(
      extractGreetingName(email({ html: "<p>Hola!</p>" })),
    ).toBeUndefined();
  });

  it("no extrae si no hay saludo", () => {
    expect(
      extractGreetingName(
        email({ html: "<p>Realizaste un consumo de S/ 10.00</p>" }),
      ),
    ).toBeUndefined();
  });

  it("normaliza nombres compuestos a Title Case", () => {
    expect(titleCaseName("MARIA DEL CARMEN")).toBe("Maria Del Carmen");
    expect(titleCaseName("smith")).toBe("Smith");
  });
});