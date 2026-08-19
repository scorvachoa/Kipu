export const BANK_NAMES = [
  "BCP",
  "INTERBANK",
  "BCP IO",
  "BBVA",
  "SCOTIABANK",
  "MIBANCO",
  "BANBIF",
  "BANCO DE LA NACION",
  "CAJA",
  "FINANCIERA",
  "OTRO",
] as const;
export type BankingBank = string;

export const CARD_TYPES = ["credit", "debit"] as const;
export type CardType = (typeof CARD_TYPES)[number];

export const TRANSACTION_TYPES = [
  "purchase",
  "payment",
  "transfer",
  "withdrawal",
  "refund",
  "fee",
  "income",
  "other",
] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const PAYMENT_METHODS = [
  "credit_card",
  "debit_card",
  "bank_account",
  "unknown",
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const TRANSACTION_STATUSES = [
  "confirmed",
  "pending",
  "ignored",
  "needs_review",
] as const;
export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];

export const TRANSACTION_SOURCES = ["gmail"] as const;
export type TransactionSource = (typeof TRANSACTION_SOURCES)[number];

export const CURRENCIES = ["PEN", "USD", "EUR"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const DEFAULT_CURRENCY: Currency = "PEN";
export const DEFAULT_TIMEZONE = "America/Lima";