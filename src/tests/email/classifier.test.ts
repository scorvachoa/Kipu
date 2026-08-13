import { describe, expect, it } from "vitest";
import { classifyByRules } from "@/lib/email/classifier";
import type { MerchantRule } from "@/types/categories";

const rules: MerchantRule[] = [
  {
    id: "1",
    user_id: "u",
    merchant_pattern: "WONG",
    category_id: "cat-alimentacion",
    priority: 10,
    active: true,
    created_at: "",
    updated_at: "",
  },
  {
    id: "2",
    user_id: "u",
    merchant_pattern: "UBER",
    category_id: "cat-transporte",
    priority: 10,
    active: true,
    created_at: "",
    updated_at: "",
  },
  {
    id: "3",
    user_id: "u",
    merchant_pattern: "NETFLIX",
    category_id: "cat-suscripciones",
    priority: 5,
    active: false,
    created_at: "",
    updated_at: "",
  },
];

describe("classifyByRules", () => {
  it("clasifica un comercio conocido", () => {
    expect(classifyByRules(rules, "WONG")).toBe("cat-alimentacion");
  });

  it("ignora reglas inactivas", () => {
    expect(classifyByRules(rules, "NETFLIX")).toBeNull();
  });

  it("aplica la regla con mayor prioridad", () => {
    const extra: MerchantRule = {
      id: "4",
      user_id: "u",
      merchant_pattern: "WONG",
      category_id: "cat-generica",
      priority: 20,
      active: true,
      created_at: "",
      updated_at: "",
    };
    expect(classifyByRules([...rules, extra], "WONG")).toBe("cat-generica");
  });

  it("devuelve null para comercio desconocido", () => {
    expect(classifyByRules(rules, "COMERCIO FANTASMA")).toBeNull();
  });

  it("devuelve null sin merchant", () => {
    expect(classifyByRules(rules, undefined)).toBeNull();
  });
});