import type {
  BankingBank,
  Currency,
  PaymentMethod,
  TransactionSource,
  TransactionStatus,
  TransactionType,
} from "./shared";

export interface ParsedTransaction {
  bank: BankingBank;
  transactionType: TransactionType;
  paymentMethod: PaymentMethod;
  amount: number;
  currency: Currency;
  transactionDate: string;
  transactionTime?: string;
  cardLast4?: string;
  accountLast4?: string;
  merchant?: string;
  operationNumber?: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  person_id: string | null;
  card_id: string | null;
  account_id: string | null;
  bank: BankingBank;
  transaction_type: TransactionType;
  payment_method: PaymentMethod;
  amount: number;
  currency: Currency;
  transaction_date: string;
  transaction_time: string | null;
  merchant: string | null;
  normalized_merchant: string | null;
  category_id: string | null;
  description: string | null;
  operation_number: string | null;
  fingerprint: string | null;
  gmail_message_id: string | null;
  gmail_thread_id: string | null;
  source: TransactionSource;
  raw_reference: string | null;
  status: TransactionStatus;
  created_at: string;
  updated_at: string;
}

export type NewTransaction = Omit<Transaction, "id" | "created_at" | "updated_at">;