import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { decryptToken, encryptToken } from "@/lib/security/tokens";

const ORIGINAL_KEY = process.env.GMAIL_TOKEN_ENCRYPTION_KEY;

beforeEach(() => {
  process.env.GMAIL_TOKEN_ENCRYPTION_KEY = "clave-de-prueba-32-caracteres-!!!";
});

afterEach(() => {
  process.env.GMAIL_TOKEN_ENCRYPTION_KEY = ORIGINAL_KEY;
});

describe("tokens", () => {
  it("cifra y descifra correctamente", () => {
    const original = "refresh-token-secreto";
    const encrypted = encryptToken(original);
    expect(encrypted).not.toContain(original);
    expect(decryptToken(encrypted)).toBe(original);
  });

  it("produce cifrados diferentes para el mismo valor", () => {
    const encrypted1 = encryptToken("mismo valor");
    const encrypted2 = encryptToken("mismo valor");
    expect(encrypted1).not.toBe(encrypted2);
  });

  it("lanza error si la clave no está configurada", () => {
    delete process.env.GMAIL_TOKEN_ENCRYPTION_KEY;
    expect(() => encryptToken("x")).toThrow(/GMAIL_TOKEN_ENCRYPTION_KEY/);
  });
});