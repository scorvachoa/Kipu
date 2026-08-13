import { normalizeMerchant } from "./merchant";
import type { ParsedTransaction } from "@/types/transactions";
import { DEFAULT_CURRENCY } from "@/types/shared";

export interface NormalizedTransactionInput extends ParsedTransaction {
  categoryId?: string | null;
}

export interface NormalizedTransaction {
  bank: ParsedTransaction["bank"];
  transactionType: ParsedTransaction["transactionType"];
  paymentMethod: ParsedTransaction["paymentMethod"];
  amount: number;
  currency: ParsedTransaction["currency"];
  transactionDate: string;
  transactionTime: string | null;
  cardLast4?: string;
  accountLast4?: string;
  merchant: string | null;
  normalizedMerchant: string | null;
  operationNumber: string | null;
  categoryId: string | null;
}

export function normalizeParsedTransaction(
  input: NormalizedTransactionInput,
): NormalizedTransaction {
  const merchant = input.merchant ?? null;

  return {
    bank: input.bank,
    transactionType: input.transactionType,
    paymentMethod: input.paymentMethod,
    amount: input.amount,
    currency: input.currency || DEFAULT_CURRENCY,
    transactionDate: input.transactionDate,
    transactionTime: input.transactionTime ?? null,
    cardLast4: input.cardLast4,
    accountLast4: input.accountLast4,
    merchant,
    normalizedMerchant: normalizeMerchant(merchant ?? undefined) ?? null,
    operationNumber: input.operationNumber ?? null,
    categoryId: input.categoryId ?? null,
  };
}