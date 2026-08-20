import type { BankEmailParser, EmailEnvelope } from "../bank-email-parser";
import type {
  PaymentMethod,
  TransactionType,
} from "@/types/shared";
import type { ParsedTransaction } from "@/types/transactions";
import {
  amountAfterLabels,
  canonical,
  canonicalText,
  extractDate,
  extractLast4,
  extractTextFragments,
  extractTime,
  last4AfterLabels,
  maskedLast4,
  merchantFromSubject,
  parseAmountCurrency,
  valueAfterLabels,
} from "./support";

export const INTERBANK_BANK = "INTERBANK";

const AMOUNT_LABELS = [
  "Monto total",
  "Moneda y monto",
  "Monto y moneda",
];

const CARD_DETAIL_LABELS = [
  "TARJETA:",
  "COMERCIO:",
  "MONTO:",
  "FECHA:",
  "HORA:",
];

export const interbankParser: BankEmailParser = {
  bank: INTERBANK_BANK,

  canParse(email: EmailEnvelope): boolean {
    const target = `${email.subject} ${email.from}`.toLowerCase();
    const subject = email.subject.toLowerCase();
    if (!(target.includes("interbank") || target.includes("interbank.pe"))) {
      return false;
    }
    return /consumo|compra|transferencia|pago/.test(subject);
  },

  parse(email: EmailEnvelope): ParsedTransaction[] {
    const source = email.html ?? email.text ?? "";
    const fragments = extractTextFragments(source);
    const fullText = canonicalText(fragments);

    const cardDetail = parseCardDetailLayout(fragments);
    if (cardDetail) {
      return [cardDetail];
    }

    const amountInfo = amountAfterLabels(fragments, AMOUNT_LABELS);
    const transactionDate = extractDate(fragments);
    const transactionTime = extractTime(fragments);

    if (amountInfo.amount === undefined || !transactionDate) {
      return [];
    }

    const accountLast4 = last4AfterLabels(fragments, [
      "Cuenta a cargo",
      "Cuenta cargo",
    ]);
    const cardLabelLast4 = last4AfterLabels(fragments, [
      "Tarjeta de crédito",
      "Tarjeta de credito",
      "Tarjeta de débito",
      "Tarjeta de debito",
      "Tarjeta",
    ]);
    const cardLast4 =
      cardLabelLast4 ?? (accountLast4 ? undefined : maskedLast4(fragments));

    return [
      {
        bank: INTERBANK_BANK,
        transactionType: detectInterbankTransactionType(fullText),
        paymentMethod: detectInterbankPaymentMethod(fullText),
        amount: amountInfo.amount,
        currency: amountInfo.currency,
        transactionDate,
        transactionTime,
        accountLast4,
        cardLast4,
        merchant:
          valueAfterLabels(fragments, [
            "Comercio",
            "Empresa",
            "Establecimiento",
          ]) ?? merchantFromSubject(email.subject),
        operationNumber: valueAfterLabels(fragments, [
          "Código de operación",
        ]),
      },
    ];
  },
};

function parseCardDetailLayout(
  fragments: string[],
): ParsedTransaction | undefined {
  const start = fragments.findIndex(
    (fragment) => canonical(fragment) === "TARJETA:",
  );
  if (start === -1) {
    return undefined;
  }

  for (let k = 0; k < CARD_DETAIL_LABELS.length; k++) {
    if (canonical(fragments[start + k]) !== CARD_DETAIL_LABELS[k]) {
      return undefined;
    }
  }

  const values = fragments.slice(start + 5, start + 10);
  const [cardValue, merchant, monto, fecha, hora] = values;
  const amountInfo = parseAmountCurrency(monto ?? "");
  const transactionDate = fecha ? extractDate([fecha]) : undefined;

  if (amountInfo.amount === undefined || !transactionDate) {
    return undefined;
  }

  return {
    bank: INTERBANK_BANK,
    transactionType: "purchase",
    paymentMethod: "credit_card",
    amount: amountInfo.amount,
    currency: amountInfo.currency,
    transactionDate,
    transactionTime: hora ? extractTime([hora]) : undefined,
    cardLast4: extractLast4(cardValue ?? ""),
    merchant,
  };
}

export function detectInterbankTransactionType(
  fullText: string,
): TransactionType {
  if (/PAGO/.test(fullText)) {
    return "payment";
  }
  if (/TRANSFERENCIA/.test(fullText)) {
    return "transfer";
  }
  if (/CONSUMO|COMPRA/.test(fullText)) {
    return "purchase";
  }
  return "other";
}

export function detectInterbankPaymentMethod(
  fullText: string,
): PaymentMethod {
  if (/VISA|MASTERCARD|AMERICAN EXPRESS|DINERS/.test(fullText)) {
    return "credit_card";
  }
  if (/CUENTA/.test(fullText)) {
    return "bank_account";
  }
  return "unknown";
}