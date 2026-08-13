import type { Account, Card } from "@/types/cards";
import type { MerchantRule } from "@/types/categories";
import type {
  BankingBank,
  TransactionStatus,
} from "@/types/shared";
import type { ParsedTransaction } from "@/types/transactions";
import type { EmailEnvelope } from "./bank-email-parser";
import { classifyByRules } from "./classifier";
import { fallbackFingerprint } from "./deduplication";
import { normalizeParsedTransaction } from "./normalizer";
import type { NormalizedTransaction } from "./normalizer";
import { parserForEmail } from "./parsers";
import type { TransactionRepository } from "./repositories";

export interface StaticResources {
  cards: Card[];
  accounts: Account[];
  rules: MerchantRule[];
}

export interface ResolvedTransaction {
  parsed: ParsedTransaction;
  normalized: NormalizedTransaction;
  duplicate: boolean;
  status: TransactionStatus;
  cardId: string | null;
  accountId: string | null;
  personId: string | null;
  categoryId: string | null;
}

export interface EmailProcessingResult {
  handled: boolean;
  transactions: ResolvedTransaction[];
}

export async function loadResources(
  repository: TransactionRepository,
): Promise<StaticResources> {
  const [cards, accounts, rules] = await Promise.all([
    repository.listCards(),
    repository.listAccounts(),
    repository.listRules(),
  ]);
  return { cards, accounts, rules };
}

export function identifyInstrument(
  parsed: ParsedTransaction,
  resources: StaticResources,
): { cardId: string | null; accountId: string | null; personId: string | null } {
  const last4 = parsed.cardLast4 ?? parsed.accountLast4;
  if (!last4) {
    return { cardId: null, accountId: null, personId: null };
  }

  const card = resources.cards.find(
    (candidate) =>
      candidate.bank === parsed.bank &&
      candidate.last4 === last4 &&
      candidate.active,
  );
  if (card) {
    return {
      cardId: card.id,
      accountId: null,
      personId: card.owner_person_id,
    };
  }

  const account = resources.accounts.find(
    (candidate) =>
      candidate.bank === parsed.bank &&
      candidate.last4 === last4 &&
      candidate.active,
  );
  if (account) {
    return {
      cardId: null,
      accountId: account.id,
      personId: account.owner_person_id,
    };
  }

  return { cardId: null, accountId: null, personId: null };
}

export async function isDuplicate(
  parsed: ParsedTransaction,
  normalized: NormalizedTransaction,
  email: EmailEnvelope,
  repository: TransactionRepository,
): Promise<boolean> {
  if (email.id && (await repository.existsByGmailMessageId(email.id))) {
    return true;
  }

  if (parsed.operationNumber) {
    return repository.existsByOperation(parsed.bank, parsed.operationNumber);
  }

  return repository.existsByFingerprint(
    buildTransactionFingerprint(parsed, normalized),
  );
}

export function buildTransactionFingerprint(
  parsed: ParsedTransaction,
  normalized: NormalizedTransaction,
): string {
  return fallbackFingerprint({
    bank: parsed.bank,
    cardLast4: parsed.cardLast4 ?? parsed.accountLast4,
    transactionDate: normalized.transactionDate,
    amount: parsed.amount,
    merchant: normalized.normalizedMerchant ?? undefined,
  });
}

export async function resolveTransaction(
  parsed: ParsedTransaction,
  email: EmailEnvelope,
  repository: TransactionRepository,
  resources: StaticResources,
): Promise<ResolvedTransaction> {
  const normalized = normalizeParsedTransaction(parsed);
  const instrument = identifyInstrument(parsed, resources);
  const duplicate = await isDuplicate(
    parsed,
    normalized,
    email,
    repository,
  );

  const categoryId = classifyByRules(
    resources.rules,
    normalized.normalizedMerchant ?? undefined,
  );

  const needsCategory = !categoryId;
  const needsInstrument = !instrument.cardId && !instrument.accountId;
  const status: TransactionStatus =
    needsInstrument || needsCategory ? "needs_review" : "confirmed";

  return {
    parsed,
    normalized,
    duplicate,
    status,
    cardId: instrument.cardId,
    accountId: instrument.accountId,
    personId: instrument.personId,
    categoryId,
  };
}

export async function processEmail(
  email: EmailEnvelope,
  repository: TransactionRepository,
  resources: StaticResources,
): Promise<EmailProcessingResult> {
  const parser = parserForEmail(email);
  if (!parser) {
    return { handled: false, transactions: [] };
  }

  const parsedTransactions = parser.parse(email);
  if (parsedTransactions.length === 0) {
    return { handled: true, transactions: [] };
  }

  const transactions: ResolvedTransaction[] = [];
  for (const parsed of parsedTransactions) {
    transactions.push(
      await resolveTransaction(parsed, email, repository, resources),
    );
  }

  return { handled: true, transactions };
}

export function instrumentKey(bank: BankingBank, last4: string): string {
  return `${bank}:${last4}`;
}