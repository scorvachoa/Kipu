import { generateJSON } from "@/lib/ai/generate-json";
import {
  emailProviderOrder,
  hasEmailAiProvider,
} from "@/lib/ai/providers";
import { PERU_FINANCIAL_SENDERS } from "@/lib/gmail/query";
import { canonicalText, extractTextFragments } from "./support";
import type { EmailEnvelope } from "../bank-email-parser";
import type { ParsedTransaction } from "@/types/transactions";
import {
  PAYMENT_METHODS,
  TRANSACTION_TYPES,
  type Currency,
  type PaymentMethod,
  type TransactionType,
} from "@/types/shared";

export interface AiExtraction {
  bank?: string;
  amount?: number;
  currency?: string;
  transactionDate?: string;
  transactionTime?: string;
  merchant?: string;
  cardLast4?: string;
  accountLast4?: string;
  transactionType?: string;
  paymentMethod?: string;
  operationNumber?: string;
}

const AMOUNT_PATTERN =
  /\b(?:S\/|S\/\.|S\.?\s?\/|US\$|USD|US\$|EUR)\s?[\d.,]+\b/i;

const TRANSACTION_HINT_PATTERN =
  /\b(consumo|compra|retiro|pago|transferencia|dep[óo]sito|abono|yape|cargo|movimiento|alerta)\b/i;

const MARKETING_PATTERN =
  /\b(promoci[óo]n|oferta|prestamo preaprobado|aumento de l[ií]nea|beneficios?|cashback|renovaci[óo]n|reg[ií]strate|suscr[ií]bete|t[ií]tulo|campa[ñn]a|newsletter)\b/i;

const BANK_MATCH_PATTERN =
  /\b(bcp|interbank|io\.pe|bbva|scotiabank|banbif|mibanco|banco de la naci[óo]n|banco pichincha|banco gnb|bnp|ca[ja]a (arequipa|cusco|piura|huancayo|sullana|trujillo|maynas|pachac[uu]tec)|financiera confianza|financiera oh|yape|plin|tunki|ligo|izipay|niubiz|culqi|pagoseguro|western union|moneygram)\b/i;

const SUBJECT_PATTERN =
  /(estado de cuenta|constancia|notificaci[óo]n|alerta|aviso|operaci[óo]n|transacci[óo]n|movimiento|confirmaci[óo]n)/i;

function extractSource(email: EmailEnvelope): string {
  return email.html ?? email.text ?? "";
}

function looksLikeTransaction(text: string, subject: string): boolean {
  const target = `${subject} ${text}`.toLowerCase();
  if (!AMOUNT_PATTERN.test(target)) {
    return false;
  }
  if (MARKETING_PATTERN.test(target)) {
    return false;
  }
  return (
    TRANSACTION_HINT_PATTERN.test(target) ||
    BANK_MATCH_PATTERN.test(target) ||
    SUBJECT_PATTERN.test(subject)
  );
}

export function senderMatchesKnownBank(from: string | undefined): boolean {
  if (!from) {
    return false;
  }
  const lower = from.toLowerCase();
  if (BANK_MATCH_PATTERN.test(lower)) {
    return true;
  }
  return PERU_FINANCIAL_SENDERS.some((sender) => lower.includes(sender));
}

export function shouldAttemptAiParse(email: EmailEnvelope): boolean {
  if (!hasEmailAiProvider()) {
    return false;
  }
  const text = extractSource(email);
  if (!text) {
    return false;
  }
  if (!looksLikeTransaction(text, email.subject ?? "")) {
    return false;
  }
  return (
    senderMatchesKnownBank(email.from) ||
    BANK_MATCH_PATTERN.test(text) ||
    SUBJECT_PATTERN.test(email.subject ?? "")
  );
}

function normalizeBank(raw: string | undefined): string {
  if (!raw) {
    return "OTRO";
  }
  const cleaned = raw
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase()
    .replace(/\b(?:PERU|DEL|DE|SA|S\.A|SAC|S\.A\.C|BANCO|BANCA)\b/g, "")
    .replace(/[^A-ZÁÉÍÓÚÑ0-9\s]/g, "")
    .trim();
  if (!cleaned) {
    return "OTRO";
  }
  if (/^IO\b|IO BCP|BANCO IO|\.IO/i.test(cleaned)) {
    return "BCP IO";
  }
  if (/BCP|CREDITO/i.test(cleaned)) {
    return "BCP";
  }
  if (/INTERBANK|INTERBANK/.test(cleaned)) {
    return "INTERBANK";
  }
  if (/BBVA/.test(cleaned)) {
    return "BBVA";
  }
  if (/SCOTIA/.test(cleaned)) {
    return "SCOTIABANK";
  }
  if (/MIBANCO/.test(cleaned)) {
    return "MIBANCO";
  }
  if (/BANBIF/.test(cleaned)) {
    return "BANBIF";
  }
  if (/NACION|BNP/.test(cleaned)) {
    return "BANCO DE LA NACION";
  }
  if (/CAJA/.test(cleaned)) {
    return "CAJA";
  }
  if (/FINANCIERA/.test(cleaned)) {
    return "FINANCIERA";
  }
  return cleaned;
}

function normalizeTransactionType(raw: string | undefined): TransactionType {
  if (!raw) {
    return "other";
  }
  const value = raw.trim().toLowerCase();
  if ((TRANSACTION_TYPES as readonly string[]).includes(value)) {
    return value as TransactionType;
  }
  if (/compra|consumo|purchase/.test(value)) {
    return "purchase";
  }
  if (/retiro|withdrawal/.test(value)) {
    return "withdrawal";
  }
  if (/pago|payment/.test(value)) {
    return "payment";
  }
  if (/transfer/.test(value)) {
    return "transfer";
  }
  if (/reembolso|devoluci[óo]n|refund/.test(value)) {
    return "refund";
  }
  if (/comisi[óo]n|fee/.test(value)) {
    return "fee";
  }
  if (/ingreso|abono|income/.test(value)) {
    return "income";
  }
  return "other";
}

function normalizePaymentMethod(raw: string | undefined): PaymentMethod {
  if (!raw) {
    return "unknown";
  }
  const value = raw.trim().toLowerCase();
  if ((PAYMENT_METHODS as readonly string[]).includes(value)) {
    return value as PaymentMethod;
  }
  if (/tarjeta de cr[ée]dito|credit/.test(value)) {
    return "credit_card";
  }
  if (/tarjeta de d[ée]bito|debit/.test(value)) {
    return "debit_card";
  }
  if (/cuenta|cuenta bancaria|bank account/.test(value)) {
    return "bank_account";
  }
  return "unknown";
}

function normalizeCurrency(raw: string | undefined): Currency {
  const value = (raw ?? "").trim().toLowerCase();
  if (value.includes("usd") || /us\$|\$\s?\d/.test((raw ?? "").trim())) {
    return "USD";
  }
  if (value.includes("eur") || (raw ?? "").trim().includes("€")) {
    return "EUR";
  }
  return "PEN";
}

function normalizeDate(raw: string | undefined): string | undefined {
  if (!raw) {
    return undefined;
  }
  const match = raw.trim().match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!match) {
    return undefined;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return undefined;
  }
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function normalizeTime(raw: string | undefined): string | undefined {
  if (!raw) {
    return undefined;
  }
  const match = raw.trim().match(/(\d{1,2}):(\d{2})/);
  if (!match) {
    return undefined;
  }
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59 ||
    (match[1].length === 1 && hour >= 0)
  ) {
    return undefined;
  }
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function redactSensitiveData(text: string): string {
  let out = text;
  out = out.replace(
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    "[correo oculto]",
  );
  out = out.replace(/\b(?:\d{4}[\s-]?){3}\d{4}\b/g, (match) => {
    const digits = match.replace(/\D/g, "");
    return `**** **** **** ${digits.slice(-4)}`;
  });
  out = out.replace(/\b\d{16}\b/g, (match) => `**** ${match.slice(-4)}`);
  return out;
}

function sanitizeMerchant(raw: string | undefined): string | undefined {
  if (!raw) {
    return undefined;
  }
  const cleaned = raw
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^["']|["']$/g, "");
  return cleaned.length > 0 ? cleaned : undefined;
}

function sanitizeLast4(raw: string | undefined): string | undefined {
  if (!raw) {
    return undefined;
  }
  const digits = raw.replace(/\D/g, "");
  return digits.length >= 4 ? digits.slice(-4) : undefined;
}

function sanitizeOperationNumber(raw: string | undefined): string | undefined {
  if (!raw) {
    return undefined;
  }
  const cleaned = raw.trim();
  return cleaned.length > 0 && cleaned.length <= 64 ? cleaned : undefined;
}

export async function parseEmailWithAi(
  email: EmailEnvelope,
): Promise<ParsedTransaction[]> {
  if (!shouldAttemptAiParse(email)) {
    return [];
  }

  const fullText = redactSensitiveData(
    canonicalText(extractTextFragments(extractSource(email))),
  );
  const prompt = [
    "Eres el extractor de transacciones bancarias de Kipu. Parseas correos de bancos peruanos (BCP, Interbank, BBVA, Scotiabank, BanBif, MiBanco, cajas, financieras, billeteras como Yape/Plin/Tunki, etc.).",
    "",
    `Asunto: ${email.subject ?? "(vacío)"}`,
    `Remitente: ${email.from ?? "(vacío)"}`,
    "",
    "Cuerpo del correo:",
    fullText.slice(0, 4000) || "(vacío)",
    "",
    "Extrae la transacción principal. Devuelve SOLO JSON con este schema:",
    "{",
    '  "bank": "nombre del banco (ej. BBVA, SCOTIABANK, YAPE, CAJA AREQUIPA)",',
    '  "amount": 123.45,',
    '  "currency": "PEN | USD | EUR",',
    '  "transactionDate": "YYYY-MM-DD",',
    '  "transactionTime": "HH:MM (24h, opcional)",',
    '  "merchant": "nombre del comercio o contraparte (opcional)",',
    '  "cardLast4": "últimos 4 dígitos de tarjeta (opcional)",',
    '  "accountLast4": "últimos 4 dígitos de cuenta (opcional)",',
    '  "transactionType": "purchase | payment | transfer | withdrawal | refund | fee | income | other",',
    '  "paymentMethod": "credit_card | debit_card | bank_account | unknown",',
    '  "operationNumber": "número de operación (opcional)"',
    "}",
    "",
    "No uses markdown. Si no puedes extraer algo, devuelve null en los campos opcionales. Si el correo no es una transacción válida, devuelve un objeto con amount en 0.",
  ].join("\n");

  const schema = {
    type: "OBJECT",
    properties: {
      bank: { type: "STRING" },
      amount: { type: "NUMBER" },
      currency: { type: "STRING" },
      transactionDate: { type: "STRING" },
      transactionTime: { type: "STRING" },
      merchant: { type: "STRING" },
      cardLast4: { type: "STRING" },
      accountLast4: { type: "STRING" },
      transactionType: { type: "STRING" },
      paymentMethod: { type: "STRING" },
      operationNumber: { type: "STRING" },
    },
    required: [
      "bank",
      "amount",
      "currency",
      "transactionDate",
      "transactionType",
    ],
  };

  const parsed = await generateJSON<AiExtraction>({
    prompt,
    schema,
    providerOrder: emailProviderOrder(),
  });
  if (!parsed) {
    return [];
  }
  const validated = validateExtraction(parsed);
  return validated && validated.amount > 0 ? [validated] : [];
}

export function validateExtraction(
  extraction: AiExtraction,
): ParsedTransaction | null {
  const amount = Number(extraction.amount);
  const validAmount = Number.isFinite(amount) && amount > 0;
  const transactionDate = normalizeDate(extraction.transactionDate);

  if (!validAmount || !transactionDate) {
    return null;
  }

  const transaction: ParsedTransaction = {
    bank: normalizeBank(extraction.bank),
    transactionType: normalizeTransactionType(extraction.transactionType),
    paymentMethod: normalizePaymentMethod(extraction.paymentMethod),
    amount,
    currency: normalizeCurrency(extraction.currency),
    transactionDate,
  };

  const transactionTime = normalizeTime(extraction.transactionTime);
  const merchant = sanitizeMerchant(extraction.merchant);
  const cardLast4 = sanitizeLast4(extraction.cardLast4);
  const accountLast4 = sanitizeLast4(extraction.accountLast4);
  const operationNumber = sanitizeOperationNumber(extraction.operationNumber);

  if (transactionTime) {
    transaction.transactionTime = transactionTime;
  }
  if (merchant) {
    transaction.merchant = merchant;
  }
  if (cardLast4) {
    transaction.cardLast4 = cardLast4;
  }
  if (accountLast4) {
    transaction.accountLast4 = accountLast4;
  }
  if (operationNumber) {
    transaction.operationNumber = operationNumber;
  }

  return transaction;
}