import type { BankingBank } from "@/types/shared";
import type { ParsedTransaction } from "@/types/transactions";

export interface EmailEnvelope {
  id: string;
  threadId: string;
  internalDate: string;
  from: string;
  subject: string;
  html?: string;
  text?: string;
}

export interface BankEmailParser {
  bank: BankingBank;
  canParse(email: EmailEnvelope): boolean;
  parse(email: EmailEnvelope): ParsedTransaction[];
}