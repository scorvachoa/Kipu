import { describe, expect, it } from "vitest";
import {
  buildGmailQuery,
  formatGmailDate,
  isSyncRange,
  rangeToDays,
} from "@/lib/gmail/query";

describe("query", () => {
  it("formatea la fecha en formato Gmail (UTC)", () => {
    expect(formatGmailDate(new Date("2026-08-07T00:00:00Z"))).toBe(
      "2026/08/07",
    );
  });

  it.each([
    ["30d", 30],
    ["3m", 90],
    ["6m", 180],
    ["12m", 365],
  ])("convierte rango %s a %d días", (range, days) => {
    expect(rangeToDays(range as "30d")).toBe(days);
  });

  it("valida rangos conhecidos e inválidos", () => {
    expect(isSyncRange("3m")).toBe(true);
    expect(isSyncRange("2y")).toBe(false);
    expect(isSyncRange(undefined)).toBe(false);
  });

  it("construye la consulta con remitentes y fecha", () => {
    const query = buildGmailQuery(new Date("2026-05-13T00:00:00Z"));
    expect(query).toContain("from:bcp.com.pe");
    expect(query).toContain("from:interbank.com.pe");
    expect(query).toContain("from:notificacionesbcp.com.pe");
    expect(query).toContain("from:netinterbank.com.pe");
    expect(query).toContain("after:2026/05/13");
  });
});