import { describe, expect, it } from "vitest";
import {
  maskedLast4,
  merchantFromSubject,
} from "@/lib/email/parsers/support";

describe("maskedLast4", () => {
  it("extrae los últimos 4 de una máscara simple", () => {
    expect(maskedLast4(["************8795"])).toBe("8795");
  });

  it("extrae los últimos 4 de una máscara con separadores", () => {
    expect(maskedLast4(["**** 8795"])).toBe("8795");
  });

  it("extrae los últimos 4 cuando la máscara está dentro de otro texto", () => {
    expect(maskedLast4(["Número de Tarjeta: ************8795"])).toBe("8795");
  });

  it("extrae los últimos 4 cuando la máscara está pegada al final", () => {
    expect(maskedLast4(["Tarjeta **********3456 del cliente"])).toBe("3456");
  });

  it("ignora fragmentos sin máscara ni dígitos suficientes", () => {
    expect(maskedLast4(["Hola", "S/ 11.08", "045171"])).toBeUndefined();
  });
});

describe("merchantFromSubject", () => {
  it("extrae el comercio tras 'en' en el asunto", () => {
    expect(merchantFromSubject("Consumo por S/ 50.00 en NETFLIX.COM")).toBe(
      "NETFLIX.COM",
    );
  });

  it("no extrae cuando el asunto no menciona comercio", () => {
    expect(merchantFromSubject("Realizaste un consumo de S/ 11.08")).toBeUndefined();
  });

  it("rechaza resultados inútiles", () => {
    expect(merchantFromSubject("Alerta de consumo en tu tarjeta BCP")).toBeUndefined();
  });

  it("devuelve undefined sin asunto", () => {
    expect(merchantFromSubject(undefined)).toBeUndefined();
  });
});