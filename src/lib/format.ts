import { DEFAULT_CURRENCY } from "@/types/shared";

export const CURRENCY_SYMBOLS: Record<string, string> = {
  PEN: "S/",
  USD: "$",
  EUR: "€",
};

export function currencySymbol(currency: string | null | undefined): string {
  if (currency && CURRENCY_SYMBOLS[currency]) {
    return CURRENCY_SYMBOLS[currency];
  }
  return CURRENCY_SYMBOLS[DEFAULT_CURRENCY];
}

export function formatMoney(
  amount: number,
  currency: string | null | undefined = DEFAULT_CURRENCY,
): string {
  const formatted = amount.toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${currencySymbol(currency)} ${formatted}`;
}

export function formatDateShort(date: string): string {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year.slice(2)}`;
}

export function formatDateTime(date: string, time: string | null): string {
  const base = formatDateShort(date);
  return time ? `${base} · ${time}` : base;
}

export function formatRelativeDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const target = new Date(Date.UTC(year, month - 1, day));
  const today = new Date();
  const startToday = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const diffDays = Math.round((startToday - target.getTime()) / 86400000);
  if (diffDays === 0) return "Hoy";
  if (diffDays === 1) return "Ayer";
  if (diffDays > 1 && diffDays < 7) return `Hace ${diffDays} días`;
  return formatDateShort(date);
}

export function formatLastSync(lastSyncAt: string | null): string | null {
  if (!lastSyncAt) return null;
  const date = new Date(lastSyncAt);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString("es-PE", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function monthOptions(count = 12): string[] {
  const options: string[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    options.push(
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
    );
  }
  return options;
}