import type { Account, Card, Person } from "@/types/cards";
import type { Category, MerchantRule } from "@/types/categories";
import type {
  BankingBank,
  CardType,
  PaymentMethod,
  TransactionStatus,
} from "@/types/shared";
import type { ParsedTransaction } from "@/types/transactions";
import type { EmailEnvelope } from "./bank-email-parser";
import { classifyByRules } from "./classifier";
import { fallbackFingerprint } from "./deduplication";
import { normalizeParsedTransaction } from "./normalizer";
import type { NormalizedTransaction } from "./normalizer";
import { parserForEmail } from "./parsers";
import { parseEmailWithAi } from "./parsers/ai-catchall";
import { canonical } from "./parsers/support";
import { extractGreetingName } from "./person-name";
import type { TransactionRepository } from "./repositories";
import type { CategoryService } from "@/lib/ai/category-service";

export interface StaticResources {
  cards: Card[];
  accounts: Account[];
  rules: MerchantRule[];
  categories: Category[];
  people: Person[];
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
  const [cards, accounts, rules, categories, people] = await Promise.all([
    repository.listCards(),
    repository.listAccounts(),
    repository.listRules(),
    repository.listCategories(),
    repository.listPeople(),
  ]);
  return { cards, accounts, rules, categories, people };
}

export async function ensurePerson(
  name: string,
  repository: TransactionRepository,
  resources: StaticResources,
): Promise<Person | null> {
  if (!name) {
    return null;
  }
  const key = canonical(name);
  const existing = resources.people.find(
    (person) => canonical(person.name) === key,
  );
  if (existing) {
    return existing;
  }
  const created = await repository.insertPerson({
    name,
    type: "owner",
  });
  resources.people.push(created);
  return created;
}

export function identifyInstrument(
  parsed: ParsedTransaction,
  resources: StaticResources,
): { cardId: string | null; accountId: string | null; personId: string | null } {
  const instrument = identifyInstrumentFrom(parsed, resources);
  if (instrument) {
    return instrument;
  }
  return { cardId: null, accountId: null, personId: null };
}

function identifyInstrumentFrom(
  parsed: ParsedTransaction,
  resources: StaticResources,
): { cardId: string | null; accountId: string | null; personId: string | null } | null {
  const last4 = parsed.cardLast4 ?? parsed.accountLast4;
  if (!last4) {
    return null;
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

  const uniqueCards = resources.cards.filter(
    (candidate) => candidate.last4 === last4 && candidate.active,
  );
  if (uniqueCards.length === 1) {
    return {
      cardId: uniqueCards[0].id,
      accountId: null,
      personId: uniqueCards[0].owner_person_id,
    };
  }

  const uniqueAccounts = resources.accounts.filter(
    (candidate) => candidate.last4 === last4 && candidate.active,
  );
  if (uniqueAccounts.length === 1) {
    return {
      cardId: null,
      accountId: uniqueAccounts[0].id,
      personId: uniqueAccounts[0].owner_person_id,
    };
  }

  return null;
}

function cardNameFor(bank: BankingBank, last4: string): string {
  return `${bank} ****${last4}`;
}

function accountNameFor(bank: BankingBank, last4: string): string {
  return `Cuenta ${bank} ****${last4}`;
}

function cardTypeFor(paymentMethod: PaymentMethod): CardType {
  if (paymentMethod === "debit_card") {
    return "debit";
  }
  return "credit";
}

export async function ensureInstrument(
  parsed: ParsedTransaction,
  repository: TransactionRepository,
  resources: StaticResources,
  ownerPersonId?: string | null,
): Promise<{ cardId: string | null; accountId: string | null; personId: string | null }> {
  const existing = identifyInstrumentFrom(parsed, resources);
  if (existing) {
    return existing;
  }

  if (parsed.cardLast4) {
    const exists = resources.cards.some(
      (candidate) =>
        candidate.bank === parsed.bank && candidate.last4 === parsed.cardLast4,
    );
    if (!exists) {
      const card = await repository.insertCard({
        bank: parsed.bank,
        name: cardNameFor(parsed.bank, parsed.cardLast4),
        card_type: cardTypeFor(parsed.paymentMethod),
        last4: parsed.cardLast4,
        owner_person_id: ownerPersonId ?? null,
        currency: parsed.currency,
        closing_day: null,
        payment_day: null,
        active: true,
      });
      resources.cards.push(card);
      return {
        cardId: card.id,
        accountId: null,
        personId: card.owner_person_id,
      };
    }
  }

  if (parsed.accountLast4) {
    const exists = resources.accounts.some(
      (candidate) =>
        candidate.bank === parsed.bank &&
        candidate.last4 === parsed.accountLast4,
    );
    if (!exists) {
      const account = await repository.insertAccount({
        bank: parsed.bank,
        name: accountNameFor(parsed.bank, parsed.accountLast4),
        account_type: "savings",
        last4: parsed.accountLast4,
        owner_person_id: ownerPersonId ?? null,
        currency: parsed.currency,
        active: true,
      });
      resources.accounts.push(account);
      return {
        cardId: null,
        accountId: account.id,
        personId: account.owner_person_id,
      };
    }
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
  categoryService?: CategoryService,
  aiCategoryAssignments?: Map<string, string | null>,
  greetingPersonId?: string | null,
): Promise<ResolvedTransaction> {
  const normalized = normalizeParsedTransaction(parsed);

  const greetingName = extractGreetingName(email);
  const greetingPerson =
    greetingName && !greetingPersonId
      ? await ensurePerson(greetingName, repository, resources)
      : null;
  const ownerPersonId = greetingPerson?.id ?? greetingPersonId ?? null;

  const instrument = await ensureInstrument(
    parsed,
    repository,
    resources,
    ownerPersonId,
  );
  const duplicate = await isDuplicate(
    parsed,
    normalized,
    email,
    repository,
  );

  const categoryId = await resolveCategory(
    resources,
    normalized.normalizedMerchant ?? undefined,
    categoryService,
    aiCategoryAssignments,
  );

  const personId = instrument.personId ?? ownerPersonId;

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
    personId,
    categoryId,
  };
}

async function resolveCategory(
  resources: StaticResources,
  normalizedMerchant: string | undefined,
  categoryService: CategoryService | undefined,
  aiCategoryAssignments?: Map<string, string | null>,
): Promise<string | null> {
  const byRules = classifyByRules(resources.rules, normalizedMerchant);
  if (byRules) {
    return byRules;
  }

  if (aiCategoryAssignments && normalizedMerchant) {
    const assigned = aiCategoryAssignments.get(normalizedMerchant);
    if (assigned !== undefined) {
      return assigned;
    }
  }

  if (categoryService && normalizedMerchant) {
    const candidates = resources.categories.map((category) => ({
      id: category.id,
      name: category.name,
    }));
    try {
      return await categoryService.categorize(normalizedMerchant, candidates);
    } catch {
      return null;
    }
  }

  return null;
}

export async function collectUncategorizedMerchants(
  emails: EmailEnvelope[],
  resources: StaticResources,
): Promise<string[]> {
  const seen = new Set<string>();
  for (const email of emails) {
    const parser = parserForEmail(email);
    if (!parser) {
      continue;
    }
    for (const parsed of parser.parse(email)) {
      const normalized = normalizeParsedTransaction(parsed);
      const merchant = normalized.normalizedMerchant ?? undefined;
      if (!merchant) {
        continue;
      }
      if (classifyByRules(resources.rules, merchant)) {
        continue;
      }
      seen.add(merchant);
    }
  }
  return [...seen];
}

export async function processEmail(
  email: EmailEnvelope,
  repository: TransactionRepository,
  resources: StaticResources,
  categoryService?: CategoryService,
  aiCategoryAssignments?: Map<string, string | null>,
): Promise<EmailProcessingResult> {
  const parser = parserForEmail(email);
  let parsedTransactions: ParsedTransaction[] = [];

  if (parser) {
    parsedTransactions = parser.parse(email);
  }

  if (parsedTransactions.length === 0) {
    parsedTransactions = await parseEmailWithAi(email);
  } else if (
    parsedTransactions.some(
      (transaction) =>
        !transaction.merchant ||
        (!transaction.cardLast4 && !transaction.accountLast4),
    )
  ) {
    const aiTransactions = await parseEmailWithAi(email);
    if (aiTransactions.length === 1) {
      parsedTransactions = parsedTransactions.map((transaction) =>
        enrichMissingFields(transaction, aiTransactions[0]),
      );
    }
  }

  if (parsedTransactions.length === 0) {
    return { handled: false, transactions: [] };
  }

  const greetingName = extractGreetingName(email);
  const greetingPerson = greetingName
    ? await ensurePerson(greetingName, repository, resources)
    : null;
  const greetingPersonId = greetingPerson?.id ?? null;

  const transactions: ResolvedTransaction[] = [];
  for (const parsed of parsedTransactions) {
    transactions.push(
      await resolveTransaction(
        parsed,
        email,
        repository,
        resources,
        categoryService,
        aiCategoryAssignments,
        greetingPersonId,
      ),
    );
  }

  return { handled: true, transactions };
}

export function instrumentKey(bank: BankingBank, last4: string): string {
  return `${bank}:${last4}`;
}

export function enrichMissingFields(
  parsed: ParsedTransaction,
  ai: ParsedTransaction,
): ParsedTransaction {
  if (
    Math.abs(parsed.amount - ai.amount) > 0.01 ||
    parsed.transactionDate !== ai.transactionDate
  ) {
    return parsed;
  }
  const enriched = { ...parsed };
  if (!enriched.merchant && ai.merchant) {
    enriched.merchant = ai.merchant;
  }
  if (!enriched.cardLast4 && !enriched.accountLast4) {
    if (ai.cardLast4) {
      enriched.cardLast4 = ai.cardLast4;
    } else if (ai.accountLast4) {
      enriched.accountLast4 = ai.accountLast4;
    }
  }
  if (!enriched.operationNumber && ai.operationNumber) {
    enriched.operationNumber = ai.operationNumber;
  }
  return enriched;
}