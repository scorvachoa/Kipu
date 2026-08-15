import type { Account, Card, Person } from "@/types/cards";
import type { Category, MerchantRule } from "@/types/categories";
import type { BankingBank } from "@/types/shared";
import type { NewTransaction } from "@/types/transactions";

export type NewCardInput = Omit<
  Card,
  "id" | "user_id" | "created_at" | "updated_at"
>;
export type NewAccountInput = Omit<
  Account,
  "id" | "user_id" | "created_at" | "updated_at"
>;

export type NewPersonInput = Omit<
  Person,
  "id" | "user_id" | "created_at" | "updated_at"
>;

export interface TransactionRepository {
  listCards(): Promise<Card[]>;
  listAccounts(): Promise<Account[]>;
  listRules(): Promise<MerchantRule[]>;
  listCategories(): Promise<Category[]>;
  listPeople(): Promise<Person[]>;
  existsByGmailMessageId(messageId: string): Promise<boolean>;
  existsByOperation(
    bank: BankingBank,
    operationNumber: string,
  ): Promise<boolean>;
  existsByFingerprint(fingerprint: string): Promise<boolean>;
  insertTransaction(transaction: NewTransaction): Promise<void>;
  insertCard(card: NewCardInput): Promise<Card>;
  insertAccount(account: NewAccountInput): Promise<Account>;
  insertPerson(person: NewPersonInput): Promise<Person>;
}