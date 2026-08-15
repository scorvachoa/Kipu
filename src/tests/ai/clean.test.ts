import { describe, expect, it } from "vitest";
import { cleanPattern } from "@/lib/ai/rule-suggest";
import { cleanReadableName } from "@/lib/ai/merchant-enrich";

describe("cleanPattern", () => {
  it("normaliza a mayúsculas y conserva asteriscos", () => {
    expect(cleanPattern("  netflix*  ")).toBe("NETFLIX*");
  });

  it("elimina caracteres no permitidos", () => {
    expect(cleanPattern("A&B #1!")).toBe("AB 1");
  });

  it("devuelve null para entradas vacías", () => {
    expect(cleanPattern("")).toBeNull();
    expect(cleanPattern("   %%  ")).toBeNull();
    expect(cleanPattern(undefined)).toBeNull();
  });

  it("conserva espacios y asteriscos", () => {
    expect(cleanPattern("PLAZA * VEA")).toBe("PLAZA * VEA");
  });
});

describe("cleanReadableName", () => {
  it("recorta sufijos de moneda bancaria", () => {
    expect(cleanReadableName("NETFLIX S/ 49.90")).toBe("NETFLIX");
  });

  it("quita comillas envolventes", () => {
    expect(cleanReadableName('"SUPERMERCADO"')).toBe("SUPERMERCADO");
  });

  it("colapsa espacios repetidos", () => {
    expect(cleanReadableName("  TIENDA    LINDA  ")).toBe("TIENDA LINDA");
  });

  it("devuelve null para entradas vacías", () => {
    expect(cleanReadableName("")).toBeNull();
    expect(cleanReadableName(undefined)).toBeNull();
  });
});