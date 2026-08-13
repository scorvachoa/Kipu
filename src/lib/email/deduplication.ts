import type { BankingBank } from "@/types/shared";

export interface FallbackFingerprintInput {
  bank: BankingBank;
  cardLast4?: string;
  transactionDate: string;
  amount: number;
  merchant?: string;
}

export function operationFingerprint(
  bank: BankingBank,
  operationNumber: string,
): string {
  return `${bank}:${operationNumber}`;
}

export function fallbackFingerprint(input: FallbackFingerprintInput): string {
  const parts = [
    input.bank,
    input.cardLast4 ?? "?",
    input.transactionDate,
    input.amount.toFixed(2),
    input.merchant ?? "?",
  ];
  return parts.join("|");
}