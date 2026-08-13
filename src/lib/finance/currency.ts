import type { Currency } from "@/types/shared";

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  PEN: "S/",
  USD: "US$",
  EUR: "€",
};

export function formatCurrency(amount: number, currency: Currency): string {
  const formatted = amount.toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${CURRENCY_SYMBOLS[currency]} ${formatted}`;
}