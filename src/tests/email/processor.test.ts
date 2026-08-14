import { describe, expect, it } from "vitest";
import type { EmailEnvelope } from "@/lib/email/bank-email-parser";
import { bcpParser } from "@/lib/email/parsers/bcp";
import { interbankParser } from "@/lib/email/parsers/interbank";
import {
  identifyInstrument,
  isDuplicate,
  resolveTransaction,
  type StaticResources,
} from "@/lib/email/processor";
import { buildTransactionRow, runSync } from "@/lib/email/sync";
import type { SyncEmailsProvider } from "@/lib/email/sync";
import type { TransactionRepository } from "@/lib/email/repositories";
import type { CategoryService } from "@/lib/ai/category-service";
import type { MerchantRule, Category } from "@/types/categories";
import type { Account, Card } from "@/types/cards";
import type { NewTransaction } from "@/types/transactions";
import type { ParsedTransaction } from "@/types/transactions";
import {
  bcpConsumoEmail,
  interbankPagoEmail,
} from "@/tests/fixtures/emails";

class FakeRepository implements TransactionRepository {
  cards: Card[] = [];
  accounts: Account[] = [];
  rules: MerchantRule[] = [];
  categories: Category[] = [];
  stored: NewTransaction[] = [];

  async listCards() {
    return this.cards;
  }
  async listAccounts() {
    return this.accounts;
  }
  async listRules() {
    return this.rules;
  }
  async listCategories() {
    return this.categories;
  }
  async existsByGmailMessageId(messageId: string) {
    return this.stored.some((t) => t.gmail_message_id === messageId);
  }
  async existsByOperation(bank: string, operationNumber: string) {
    return this.stored.some(
      (t) => t.bank === bank && t.operation_number === operationNumber,
    );
  }
  async existsByFingerprint(fingerprint: string) {
    return this.stored.some((t) => t.fingerprint === fingerprint);
  }
  async insertTransaction(transaction: NewTransaction) {
    this.stored.push({ ...transaction });
  }
}

function makeCard(overrides: Partial<Card>): Card {
  return {
    id: "card-1",
    user_id: "u1",
    bank: "BCP",
    name: "Débito BCP",
    card_type: "debit",
    last4: "8795",
    owner_person_id: "person-yo",
    currency: "PEN",
    closing_day: null,
    payment_day: null,
    active: true,
    created_at: "",
    updated_at: "",
    ...overrides,
  };
}

function makeResources(
  cards: Card[],
  rules: MerchantRule[] = [],
  accounts: Account[] = [],
): StaticResources {
  return { cards, accounts, rules, categories: [] };
}

function firstParsedOf(email: EmailEnvelope): ParsedTransaction {
  return bcpParser.parse(email)[0];
}

const marketMaryRule: MerchantRule = {
  id: "r1",
  user_id: "u1",
  merchant_pattern: "MARKET MARY",
  category_id: "cat-alim",
  priority: 10,
  active: true,
  created_at: "",
  updated_at: "",
};

describe("identifyInstrument", () => {
  const bcpWithCard = makeResources([makeCard({})], [marketMaryRule]);

  it("asigna la tarjeta del propietario por banco + últimos 4", () => {
    const parsed = firstParsedOf(bcpConsumoEmail);
    const instrument = identifyInstrument(parsed, bcpWithCard);
    expect(instrument.cardId).toBe("card-1");
    expect(instrument.personId).toBe("person-yo");
  });

  it("asigna la tarjeta del hermano cuando corresponde", () => {
    const hermano = makeCard({
      id: "card-hermano",
      last4: "4321",
      owner_person_id: "person-hermano",
    });
    const parsed = { ...firstParsedOf(bcpConsumoEmail), cardLast4: "4321" };
    const instrument = identifyInstrument(
      parsed,
      makeResources([hermano]),
    );
    expect(instrument.cardId).toBe("card-hermano");
    expect(instrument.personId).toBe("person-hermano");
  });

  it("no asigna instrumento si no hay tarjeta ni cuenta", () => {
    const parsed = { ...firstParsedOf(bcpConsumoEmail), cardLast4: "9999" };
    const instrument = identifyInstrument(parsed, makeResources([]));
    expect(instrument.cardId).toBeNull();
    expect(instrument.personId).toBeNull();
  });

  it("coincide con una cuenta cuando no hay tarjeta", () => {
    const account: Account = {
      id: "acc-3902",
      user_id: "u1",
      bank: "INTERBANK",
      name: "Visa",
      account_type: "credit",
      last4: "3902",
      owner_person_id: "person-yo",
      currency: "PEN",
      active: true,
      created_at: "",
      updated_at: "",
    };
    const parsed = {
      bank: "INTERBANK" as const,
      cardLast4: undefined,
      accountLast4: "3902",
      transactionType: "payment" as const,
      paymentMethod: "credit_card" as const,
      amount: 200,
      currency: "PEN" as const,
      transactionDate: "2026-07-13",
    };
    const instrument = identifyInstrument(parsed, {
      cards: [],
      accounts: [account],
      rules: [],
      categories: [],
    });
    expect(instrument.accountId).toBe("acc-3902");
    expect(instrument.cardId).toBeNull();
  });
});

describe("resolveTransaction", () => {
  it("confirma un consumo con tarjeta y categoría conocidas", async () => {
    const repo = new FakeRepository();
    repo.cards = [makeCard({})];
    repo.rules = [marketMaryRule];
    const resources = makeResources(repo.cards, repo.rules);
    const resolved = await resolveTransaction(
      firstParsedOf(bcpConsumoEmail),
      bcpConsumoEmail,
      repo,
      resources,
    );
    expect(resolved.status).toBe("confirmed");
    expect(resolved.cardId).toBe("card-1");
    expect(resolved.personId).toBe("person-yo");
    expect(resolved.categoryId).toBe("cat-alim");
  });

  it("marca tarjeta desconocida como needs_review", async () => {
    const repo = new FakeRepository();
    const resources = makeResources([], [marketMaryRule]);
    const resolved = await resolveTransaction(
      firstParsedOf(bcpConsumoEmail),
      bcpConsumoEmail,
      repo,
      resources,
    );
    expect(resolved.status).toBe("needs_review");
    expect(resolved.cardId).toBeNull();
  });

  it("marca needs_review cuando falta categoría", async () => {
    const repo = new FakeRepository();
    repo.cards = [makeCard({})];
    const resources = makeResources(repo.cards, []);
    const resolved = await resolveTransaction(
      firstParsedOf(bcpConsumoEmail),
      bcpConsumoEmail,
      repo,
      resources,
    );
    expect(resolved.status).toBe("needs_review");
    expect(resolved.cardId).toBe("card-1");
  });

  it("no marca el pago Interbank como compra", async () => {
    const repo = new FakeRepository();
    const resolved = await resolveTransaction(
      interbankParser.parse(interbankPagoEmail)[0],
      interbankPagoEmail,
      repo,
      makeResources([]),
    );
    expect(resolved.parsed.transactionType).toBe("payment");
    expect(resolved.parsed.transactionType).not.toBe("purchase");
  });

  it("usa la IA solo cuando las reglas no dan categoría", async () => {
    const repo = new FakeRepository();
    repo.cards = [makeCard({})];
    const resources: StaticResources = {
      cards: repo.cards,
      accounts: [],
      rules: [marketMaryRule],
      categories: [
        {
          id: "cat-farmacia",
          user_id: "u1",
          name: "Farmacia",
          icon: null,
          parent_id: null,
          active: true,
          created_at: "",
          updated_at: "",
        },
      ],
    };
    const calls: string[] = [];
    const categoryService: CategoryService = {
      async categorize(merchant) {
        calls.push(merchant);
        return "cat-farmacia";
      },
    };

    const resolved = await resolveTransaction(
      firstParsedOf(bcpConsumoEmail),
      bcpConsumoEmail,
      repo,
      resources,
      categoryService,
    );

    expect(resolved.categoryId).toBe("cat-alim");
    expect(calls).toEqual([]);
  });

  it("asigna categoría por IA cuando no hay regla", async () => {
    const repo = new FakeRepository();
    repo.cards = [makeCard({})];
    const resources = makeResources(repo.cards, []);
    const categoryService: CategoryService = {
      async categorize() {
        return "cat-ia";
      },
    };

    const resolved = await resolveTransaction(
      firstParsedOf(bcpConsumoEmail),
      bcpConsumoEmail,
      repo,
      resources,
      categoryService,
    );

    expect(resolved.categoryId).toBe("cat-ia");
    expect(resolved.status).toBe("confirmed");
  });

  it("mantiene needs_review si la IA no devuelve categoría", async () => {
    const repo = new FakeRepository();
    repo.cards = [makeCard({})];
    const resources = makeResources(repo.cards, []);
    const categoryService: CategoryService = {
      async categorize() {
        return null;
      },
    };

    const resolved = await resolveTransaction(
      firstParsedOf(bcpConsumoEmail),
      bcpConsumoEmail,
      repo,
      resources,
      categoryService,
    );

    expect(resolved.categoryId).toBeNull();
    expect(resolved.status).toBe("needs_review");
  });
});

describe("isDuplicate", () => {
  it("detecta duplicado por gmail_message_id", async () => {
    const repo = new FakeRepository();
    const parsed = firstParsedOf(bcpConsumoEmail);
    const resolved = await resolveTransaction(
      parsed,
      bcpConsumoEmail,
      repo,
      makeResources([]),
    );
    const row = buildTransactionRow("u1", bcpConsumoEmail, resolved);
    repo.stored.push(row);

    const duplicate = await isDuplicate(
      parsed,
      resolved.normalized,
      bcpConsumoEmail,
      repo,
    );
    expect(duplicate).toBe(true);
  });

  it("detecta duplicado por fingerprint (sin operación)", async () => {
    const repo = new FakeRepository();
    const emailA = { ...bcpConsumoEmail, id: "id-a" };
    const parsed = firstParsedOf(emailA);
    const resolved = await resolveTransaction(parsed, emailA, repo, makeResources([]));
    repo.stored.push({
      ...buildTransactionRow("u1", emailA, resolved),
      gmail_message_id: null,
    });

    const emailB = { ...bcpConsumoEmail, id: "id-b" };
    const parsedB = firstParsedOf(emailB);
    const dup = await isDuplicate(parsedB, resolved.normalized, emailB, repo);
    expect(dup).toBe(true);
  });

  it("detecta duplicado por número de operación", async () => {
    const repo = new FakeRepository();
    const parsed = firstParsedOf(bcpConsumoEmail);
    const resolved = await resolveTransaction(parsed, bcpConsumoEmail, repo, makeResources([]));
    repo.stored.push({
      ...buildTransactionRow("u1", bcpConsumoEmail, resolved),
      gmail_message_id: null,
      fingerprint: "otro",
    });

    const dup = await isDuplicate(parsed, resolved.normalized, { ...bcpConsumoEmail, id: "id-x" }, repo);
    expect(dup).toBe(true);
  });
});

describe("runSync", () => {
  function providerWith(emails: EmailEnvelope[]): SyncEmailsProvider {
    return { fetchEmails: async () => emails };
  }

  it("no duplica al ejecutar sync dos veces", async () => {
    const repo = new FakeRepository();
    repo.cards = [makeCard({})];
    repo.rules = [marketMaryRule];
    const provider = providerWith([bcpConsumoEmail]);

    const first = await runSync({ userId: "u1", repository: repo, provider });
    const second = await runSync({ userId: "u1", repository: repo, provider });

    expect(first.transactionsCreated).toBe(1);
    expect(second.transactionsCreated).toBe(0);
    expect(second.duplicatesFound).toBe(1);
    expect(repo.stored.length).toBe(1);
  });

  it("cuenta tarjeta desconocida como requires_review", async () => {
    const repo = new FakeRepository();
    const result = await runSync({
      userId: "u1",
      repository: repo,
      provider: providerWith([bcpConsumoEmail]),
    });
    expect(result.transactionsCreated).toBe(1);
    expect(result.requiresReview).toBe(1);
    expect(repo.stored[0].status).toBe("needs_review");
  });

  it("registra un pago de Interbank como payment", async () => {
    const repo = new FakeRepository();
    const result = await runSync({
      userId: "u1",
      repository: repo,
      provider: providerWith([interbankPagoEmail]),
    });
    expect(result.transactionsCreated).toBe(1);
    expect(repo.stored[0].transaction_type).toBe("payment");
  });
});