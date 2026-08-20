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

export function formatMoneyMany(
  totals: Record<string, number>,
  defaultCurrency: string = DEFAULT_CURRENCY,
): string {
  const entries = Object.entries(totals).filter(([, amount]) => amount !== 0);
  if (entries.length === 0) {
    return formatMoney(0, defaultCurrency);
  }
  entries.sort(([aCurrency, aAmount], [bCurrency, bAmount]) => {
    if (aCurrency === defaultCurrency && bCurrency !== defaultCurrency) return -1;
    if (bCurrency === defaultCurrency && aCurrency !== defaultCurrency) return 1;
    return bAmount - aAmount;
  });
  return entries
    .map(([currency, amount]) => formatMoney(amount, currency))
    .join(" + ");
}

export function monthShortLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString("es-PE", { month: "short" });
}

export function formatDateShort(date: string): string {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year.slice(2)}`;
}

export function formatDateTime(date: string, time: string | null): string {
  const base = formatDateShort(date);
  return time ? `${base} · ${time}` : base;
}

export function cardNameWithLast4(
  name: string,
  last4: string | null | undefined,
): string {
  if (!last4) return name;
  return name.includes(last4) ? name : `${name} ····${last4}`;
}

export function formatLastSync(lastSyncAt: string | null): string | null {
  if (!lastSyncAt) return null;
  const date = new Date(lastSyncAt);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString("es-PE", {
    timeZone: "America/Lima",
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