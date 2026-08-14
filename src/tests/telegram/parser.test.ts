import { describe, expect, it } from "vitest";
import { parseCommand } from "@/lib/telegram/parser";

describe("parseCommand", () => {
  it("extrae comando y argumentos", () => {
    expect(parseCommand("/start AB12CD")).toEqual({
      name: "/start",
      args: "AB12CD",
    });
  });

  it("maneja argumentos con espacios", () => {
    expect(parseCommand("/start  hello world ")).toEqual({
      name: "/start",
      args: "hello world",
    });
  });

  it("devuelve comando sin argumentos", () => {
    expect(parseCommand("/ayuda")).toEqual({ name: "/ayuda", args: "" });
  });

  it("normaliza a minúsculas", () => {
    expect(parseCommand("/Resumen")).toEqual({ name: "/resumen", args: "" });
  });

  it("devuelve null para texto sin comando", () => {
    expect(parseCommand("hola")).toBeNull();
    expect(parseCommand("")).toBeNull();
  });
});