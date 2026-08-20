import type { BankEmailParser, EmailEnvelope } from "../bank-email-parser";
import type {
  PaymentMethod,
  TransactionType,
} from "@/types/shared";
import type { ParsedTransaction } from "@/types/transactions";
import {
  amountAfterLabels,
  canonicalText,
  extractDate,
  extractTextFragments,
  extractTime,
  maskedLast4,
  merchantFromSubject,
  valueAfterLabels,
} from "./support";

export const BCP_BANK = "BCP";

const AMOUNT_LABELS = [
  "Total del consumo",
  "Total retirado",
  "Total aportado",
  "Monto recibido",
  "Monto total",
];

type BcpEmailKind = "consumo" | "retiro" | "pago" | "yapeo" | "wardaditoAporte" | "wardaditoRetiro" | "other";

function kindForSubject(subject: string): BcpEmailKind {
  if (subject.includes("yapeo")) {
    return "yapeo";
  }
  if (subject.includes("wardadito")) {
    return subject.includes("aporte") ? "wardaditoAporte" : "wardaditoRetiro";
  }
  if (/consumo|compra/.test(subject)) {
    return "consumo";
  }
  if (/retiro/.test(subject)) {
    return "retiro";
  }
  if (/pago/.test(subject)) {
    return "pago";
  }
  return "other";
}

const NEGATED_TRANSACTION_PATTERNS = [/ANULACION/, /REEMBOLSO/, /DEVOLUCION/];

export const bcpParser: BankEmailParser = {
  bank: BCP_BANK,

  canParse(email: EmailEnvelope): boolean {
    const target = `${email.subject} ${email.from}`.toLowerCase();
    const subject = email.subject.toLowerCase();
    if (!target.includes("bcp")) {
      return false;
    }
    return kindForSubject(subject) !== "other";
  },

  parse(email: EmailEnvelope): ParsedTransaction[] {
    const source = email.html ?? email.text ?? "";
    const fragments = extractTextFragments(source);
    const fullText = canonicalText(fragments);
    const kind = kindForSubject(email.subject.toLowerCase());

    const amountInfo = amountAfterLabels(fragments, AMOUNT_LABELS);
    const transactionDate = extractDate(fragments);
    const transactionTime = extractTime(fragments);

    if (amountInfo.amount === undefined || !transactionDate) {
      return [];
    }

    const merchant = merchantFor(kind, fragments, email.subject);
    const cardLast4 = maskedLast4(fragments);

    return [
      {
        bank: BCP_BANK,
        transactionType: transactionTypeFor(kind, fullText),
        paymentMethod: paymentMethodFor(kind, fullText),
        amount: amountInfo.amount,
        currency: amountInfo.currency,
        transactionDate,
        transactionTime,
        cardLast4: isWardadito(kind) ? undefined : cardLast4,
        merchant,
        operationNumber: valueAfterLabels(fragments, [
          "Número de operación",
        ]),
      },
    ];
  },
};

function isWardadito(kind: BcpEmailKind): boolean {
  return kind === "wardaditoAporte" || kind === "wardaditoRetiro";
}

function transactionTypeFor(kind: BcpEmailKind, fullText: string): TransactionType {
  if (kind === "yapeo" || kind === "wardaditoRetiro") {
    return "income";
  }
  if (kind === "wardaditoAporte") {
    return "transfer";
  }
  return detectBcpTransactionType(fullText);
}

function paymentMethodFor(kind: BcpEmailKind, fullText: string): PaymentMethod {
  if (kind === "yapeo") {
    return "unknown";
  }
  if (isWardadito(kind)) {
    return "bank_account";
  }
  return detectBcpPaymentMethod(fullText);
}

function merchantFor(
  kind: BcpEmailKind,
  fragments: string[],
  subject?: string,
): string | undefined {
  if (kind === "yapeo") {
    return valueAfterLabels(fragments, ["Enviado por"]);
  }
  if (kind === "wardaditoAporte") {
    return valueAfterLabels(fragments, ["Destino"]);
  }
  if (kind === "wardaditoRetiro") {
    return valueAfterLabels(fragments, ["Origen"]);
  }
  const fromBody = valueAfterLabels(fragments, [
    "Empresa",
    "Comercio",
    "Establecimiento",
  ]);
  if (fromBody) {
    return fromBody;
  }
  return merchantFromSubject(subject);
}

export function detectBcpTransactionType(fullText: string): TransactionType {
  if (NEGATED_TRANSACTION_PATTERNS.some((pattern) => pattern.test(fullText))) {
    return "refund";
  }
  if (/RETIRO/.test(fullText)) {
    return "withdrawal";
  }
  if (/PAGO DE TARJETA|ABONO DE CUENTA/.test(fullText)) {
    return "payment";
  }
  if (/PAGO/.test(fullText)) {
    return "payment";
  }
  if (/CONSUMO|COMPRA/.test(fullText)) {
    return "purchase";
  }
  return "other";
}

export function detectBcpPaymentMethod(fullText: string): PaymentMethod {
  if (/TARJETA DE CREDITO/.test(fullText)) {
    return "credit_card";
  }
  if (/TARJETA DE DEBITO/.test(fullText)) {
    return "debit_card";
  }
  if (/CUENTA/.test(fullText)) {
    return "bank_account";
  }
  return "unknown";
}