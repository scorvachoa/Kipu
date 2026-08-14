import { format, parseISO } from "date-fns";
import { DEFAULT_TIMEZONE } from "@/types/shared";

export function formatTransactionDate(
  date: string,
  time: string | null,
): string {
  if (time) {
    const parsed = parseISO(`${date}T${time}`);
    if (!Number.isNaN(parsed.getTime())) {
      return format(parsed, "dd/MM/yyyy HH:mm");
    }
  }
  const parsed = parseISO(date);
  return format(parsed, "dd/MM/yyyy");
}

export function currentMonthKey(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: DEFAULT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
  }).format(date);
}