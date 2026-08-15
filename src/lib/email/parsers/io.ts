import type { BankEmailParser, EmailEnvelope } from "../bank-email-parser";
import type { ParsedTransaction } from "@/types/transactions";
import {
  canonical,
  canonicalText,
  extractTextFragments,
  parseAmountCurrency,
  parseSpanishDate,
} from "./support";

export const IO_BANK = "BCP IO";

function valueAfterLabel(fragments: string[], label: string): string | undefined {
  const normalized = canonical(label);
  for (let i = 0; i < fragments.length; i++) {
    const current = canonical(fragments[i]);
    if (
      current === normalized ||
      current.replace(/[:.\-*\s]+$/, "") === normalized
    ) {
      const value = fragments[i + 1];
      if (value !== undefined && value.trim()) {
        return value;
      }
    }
    if (current.startsWith(normalized)) {
      const original = fragments[i].slice(label.length);
      const rest = original.replace(/^[:.\-*\s]+/, "").trim();
      if (rest) {
        return rest;
      }
    }
  }
  return undefined;
}

export const ioParser: BankEmailParser = {
  bank: IO_BANK,

  canParse(email: EmailEnvelope): boolean {
    const target = `${email.subject} ${email.from}`.toLowerCase();
    if (!target.includes("io.pe")) {
      return false;
    }
    const subject = email.subject.toLowerCase();
    return /pago|servicio|transacci[oó]n|operaci[oó]n/.test(subject);
  },

  parse(email: EmailEnvelope): ParsedTransaction[] {
    const source = email.html ?? email.text ?? "";
    const fragments = extractTextFragments(source);
    const fullText = canonicalText(fragments);

    const amountInfo = parseAmountCurrency(
      valueAfterLabel(fragments, "Monto pagado") ?? "",
    );
    const fechaValue = valueAfterLabel(fragments, "Fecha");
    const horaValue = valueAfterLabel(fragments, "Hora");

    const parsedDate = fechaValue ? parseSpanishDate(fechaValue) : undefined;
    const parsedTime = horaValue ? parseSpanishDate(horaValue) : undefined;
    const transactionDate = parsedDate?.date;
    const transactionTime = parsedTime?.time;

    if (amountInfo.amount === undefined || !transactionDate) {
      return [];
    }

    const merchant = valueAfterLabel(fragments, "Empresa");
    const operationNumber = valueAfterLabel(fragments, "Código de operación");

    return [
      {
        bank: IO_BANK,
        transactionType: /PAGO/.test(fullText) ? "payment" : "other",
        paymentMethod: /TARJETA/.test(fullText) ? "credit_card" : "bank_account",
        amount: amountInfo.amount,
        currency: amountInfo.currency,
        transactionDate,
        transactionTime,
        merchant,
        operationNumber,
      },
    ];
  },
};