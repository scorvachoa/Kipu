import { load } from "cheerio";
import type { Currency } from "@/types/shared";
import { DEFAULT_CURRENCY } from "@/types/shared";

const SPANISH_MONTHS: Record<string, number> = {
  enero: 1,
  febrero: 2,
  marzo: 3,
  abril: 4,
  mayo: 5,
  junio: 6,
  julio: 7,
  agosto: 8,
  septiembre: 9,
  setiembre: 9,
  octubre: 10,
  noviembre: 11,
  diciembre: 12,
  ene: 1,
  feb: 2,
  mar: 3,
  abr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  ago: 8,
  sep: 9,
  set: 9,
  oct: 10,
  nov: 11,
  dic: 12,
};

export function canonical(text: string): string {
  return text
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function collapseWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function extractTextFragments(source: string): string[] {
  if (!source) {
    return [];
  }

  if (!source.includes("<")) {
    return source
      .split(/\r?\n/)
      .map(collapseWhitespace)
      .filter(Boolean);
  }

  const $ = load(source);
  const fragments: string[] = [];

  $("td, th, p, div, span, li, h1, h2, h3, strong, b, a, font, em").each(
    (_index, element) => {
      for (const child of element.childNodes) {
        if (child.type === "text" && "data" in child) {
          const text = collapseWhitespace(child.data);
          if (text) {
            fragments.push(text);
          }
        }
      }
    },
  );

  return fragments;
}

export function canonicalText(fragments: string[]): string {
  return fragments.map(canonical).join(" ");
}

export class FieldExtractor {
  constructor(private readonly fragments: string[]) {}

  get(label: string): string | undefined {
    const normalized = canonical(label);

    for (let i = 0; i < this.fragments.length; i++) {
      const current = canonical(this.fragments[i]);

      if (current === normalized) {
        const value = this.fragments[i + 1];
        if (value !== undefined) {
          return value;
        }
      }

      if (current.startsWith(normalized)) {
        const rest = current
          .slice(normalized.length)
          .replace(/^[:.\-*\s]+/, "")
          .trim();
        if (rest) {
          return rest;
        }
      }
    }

    return undefined;
  }

  getValueAfter(pattern: RegExp): string | undefined {
    for (let i = 0; i < this.fragments.length; i++) {
      if (pattern.test(canonical(this.fragments[i]))) {
        const value = this.fragments[i + 1];
        if (value !== undefined) {
          return value;
        }
      }
    }
    return undefined;
  }

  getMatching(pattern: RegExp): string | undefined {
    return this.fragments.find((fragment) =>
      pattern.test(canonical(fragment)),
    );
  }
}

export function parseAmountCurrency(
  value: string,
): { amount: number | undefined; currency: Currency } {
  const digitIndex = value.search(/\d/);
  if (digitIndex === -1) {
    return { amount: undefined, currency: DEFAULT_CURRENCY };
  }

  const prefix = value.slice(0, digitIndex);
  const rest = value.slice(digitIndex);
  const numberMatch = rest.match(/^[\d.,]+/);
  if (!numberMatch) {
    return { amount: undefined, currency: DEFAULT_CURRENCY };
  }

  return {
    amount: parseDecimal(numberMatch[0]),
    currency: currencyFromPrefix(prefix),
  };
}

function currencyFromPrefix(prefix: string): Currency {
  const upper = prefix.toUpperCase();
  if (upper.includes("$") || upper.startsWith("US")) {
    return "USD";
  }
  if (upper.includes("€") || upper.includes("EUR")) {
    return "EUR";
  }
  return "PEN";
}

function parseDecimal(raw: string): number | undefined {
  const cleaned = raw.replace(/\s/g, "");
  if (!cleaned) {
    return undefined;
  }

  let normalized: string;
  if (cleaned.includes(",") && cleaned.includes(".")) {
    normalized = cleaned.replace(/,/g, "");
  } else if (cleaned.includes(",")) {
    normalized = cleaned.replace(",", ".");
  } else {
    normalized = cleaned;
  }

  const number = Number(normalized);
  return Number.isFinite(number) ? number : undefined;
}

export function parseSpanishDate(
  value: string,
): { date?: string; time?: string } {
  const timeMatch = value.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  let time: string | undefined;
  if (timeMatch) {
    let hour = parseInt(timeMatch[1], 10);
    const minute = timeMatch[2];
    const ampm = timeMatch[3].toUpperCase();
    if (ampm === "PM" && hour < 12) {
      hour += 12;
    }
    if (ampm === "AM" && hour === 12) {
      hour = 0;
    }
    time = `${String(hour).padStart(2, "0")}:${minute}`;
  }

  const dateMatch = value.match(
    /(\d{1,2})\s+(?:de\s+)?([A-Za-záéíóúñÁÉÍÓÚÑ]+?)(?:\s+de\s+|\s+)(\d{4})/i,
  );
  if (dateMatch) {
    const month = SPANISH_MONTHS[dateMatch[2].toLowerCase().replace(/\.$/, "")];
    if (month) {
      const day = dateMatch[1].padStart(2, "0");
      const year = dateMatch[3];
      return {
        date: `${year}-${String(month).padStart(2, "0")}-${day}`,
        time,
      };
    }
  }

  const numericMatch = value.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (numericMatch) {
    return {
      date: `${numericMatch[3]}-${numericMatch[2].padStart(2, "0")}-${numericMatch[1].padStart(2, "0")}`,
      time,
    };
  }

  return { date: undefined, time };
}

export function extractDate(fragments: string[]): string | undefined {
  for (const fragment of fragments) {
    const parsed = parseSpanishDate(fragment);
    if (parsed.date) {
      return parsed.date;
    }
  }
  return undefined;
}

export function extractTime(fragments: string[]): string | undefined {
  for (const fragment of fragments) {
    const parsed = parseSpanishDate(fragment);
    if (parsed.time) {
      return parsed.time;
    }
  }
  return undefined;
}

export function extractLast4(value: string): string | undefined {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 4 ? digits.slice(-4) : undefined;
}

function labelMatches(fragment: string, label: string): boolean {
  const current = canonical(fragment);
  const normalized = canonical(label);
  if (current === normalized) {
    return true;
  }
  return current.replace(/[:.\-*\s]+$/, "") === normalized;
}

export function valueAfterLabels(
  fragments: string[],
  labels: string[],
): string | undefined {
  for (let i = 0; i < fragments.length; i++) {
    if (!labels.some((label) => labelMatches(fragments[i], label))) {
      continue;
    }
    const value = fragments[i + 1];
    if (value !== undefined && value.trim()) {
      return value;
    }
  }
  return undefined;
}

export function amountAfterLabels(
  fragments: string[],
  labels: string[],
): { amount: number | undefined; currency: Currency } {
  for (let i = 0; i < fragments.length; i++) {
    if (!labels.some((label) => labelMatches(fragments[i], label))) {
      continue;
    }
    for (let j = i + 1; j < Math.min(i + 4, fragments.length); j++) {
      const info = parseAmountCurrency(fragments[j]);
      if (info.amount !== undefined) {
        return info;
      }
    }
  }
  return { amount: undefined, currency: DEFAULT_CURRENCY };
}

export function last4AfterLabels(
  fragments: string[],
  labels: string[],
): string | undefined {
  for (let i = 0; i < fragments.length; i++) {
    if (!labels.some((label) => labelMatches(fragments[i], label))) {
      continue;
    }
    for (let j = i + 1; j < Math.min(i + 4, fragments.length); j++) {
      const digits = fragments[j].replace(/\D/g, "");
      if (digits.length >= 4) {
        return digits.slice(-4);
      }
    }
  }
  return undefined;
}

export function maskedLast4(fragments: string[]): string | undefined {
  for (const fragment of fragments) {
    const trimmed = fragment.trim();
    if (
      !/^[\d*\s]+$/.test(trimmed) ||
      (trimmed.match(/\*/g) ?? []).length < 2
    ) {
      continue;
    }
    const digits = trimmed.replace(/\D/g, "");
    if (digits.length >= 4) {
      return digits.slice(-4);
    }
  }
  return undefined;
}