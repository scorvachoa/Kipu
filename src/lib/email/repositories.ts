import type { Account, Card } from "@/types/cards";
import type { Category, MerchantRule } from "@/types/categories";
import type { BankingBank } from "@/types/shared";
import type { NewTransaction } from "@/types/transactions";

export interface TransactionRepository {
  listCards(): Promise<Card[]>;
  listAccounts(): Promise<Account[]>;
  listRules(): Promise<MerchantRule[]>;
  listCategories(): Promise<Category[]>;
  existsByGmailMessageId(messageId: string): Promise<boolean>;
  existsByOperation(
    bank: BankingBank,
    operationNumber: string,
  ): Promise<boolean>;
  existsByFingerprint(fingerprint: string): Promise<boolean>;
  insertTransaction(transaction: NewTransaction): Promise<void>;
}