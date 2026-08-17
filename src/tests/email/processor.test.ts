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
import type { Account, Card, Person } from "@/types/cards";
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
  people: Person[] = [];
  stored: NewTransaction[] = [];

  async listCards() {
    return [...this.cards];
  }
  async listAccounts() {
    return [...this.accounts];
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
  async insertCard(card: Omit<Card, "id" | "user_id" | "created_at" | "updated_at">) {
    const id = `card-${this.cards.length + 1}`;
    const created: Card = {
      id,
      user_id: "u1",
      ...card,
      created_at: "",
      updated_at: "",
    };
    this.cards.push(created);
    return created;
  }
  async insertAccount(account: Omit<Account, "id" | "user_id" | "created_at" | "updated_at">) {
    const id = `acc-${this.accounts.length + 1}`;
    const created: Account = {
      id,
      user_id: "u1",
      ...account,
      created_at: "",
      updated_at: "",
    };
    this.accounts.push(created);
    return created;
  }
  async listPeople() {
    return [...this.people];
  }
  async insertPerson(person: Omit<Person, "id" | "user_id" | "created_at" | "updated_at">) {
    const id = `person-${this.people.length + 1}`;
    const created: Person = {
      id,
      user_id: "u1",
      ...person,
      created_at: "",
      updated_at: "",
    };
    this.people.push(created);
    return created;
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
  return { cards, accounts, rules, categories: [], people: [] };
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
      people: [],
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

  it("auto-crea la tarjeta desconocida", async () => {
    const repo = new FakeRepository();
    const resources = makeResources([], [marketMaryRule]);
    const resolved = await resolveTransaction(
      firstParsedOf(bcpConsumoEmail),
      bcpConsumoEmail,
      repo,
      resources,
    );
    expect(repo.cards).toHaveLength(1);
    expect(repo.cards[0].bank).toBe("BCP");
    expect(repo.cards[0].last4).toBe("8795");
    expect(repo.cards[0].name).toBe("BCP ****8795");
    expect(resolved.cardId).toBe(repo.cards[0].id);
    expect(resolved.status).toBe("confirmed");
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

  it("auto-crea la persona del saludo y la vincula a la transacción y la tarjeta", async () => {
    const repo = new FakeRepository();
    const emailConSaludo: EmailEnvelope = {
      ...bcpConsumoEmail,
      html: `<p>Hola SMITH, ¡Tu operación se realizó con éxito!</p>${bcpConsumoEmail.html}`,
    };
    const resources = makeResources([], [marketMaryRule]);
    const resolved = await resolveTransaction(
      firstParsedOf(emailConSaludo),
      emailConSaludo,
      repo,
      resources,
    );
    expect(repo.people).toHaveLength(1);
    expect(repo.people[0].name).toBe("Smith");
    expect(resolved.personId).toBe(repo.people[0].id);
    expect(repo.cards[0].owner_person_id).toBe(repo.people[0].id);
    expect(resolved.status).toBe("confirmed");
  });

  it("reutiliza la persona existente en lugar de duplicarla", async () => {
    const repo = new FakeRepository();
    repo.people = [
      {
        id: "person-existing",
        user_id: "u1",
        name: "Smith",
        type: "owner",
        created_at: "",
        updated_at: "",
      },
    ];
    const emailConSaludo: EmailEnvelope = {
      ...bcpConsumoEmail,
      html: `<p>Hola SMITH, ¡Tu operación se realizó con éxito!</p>${bcpConsumoEmail.html}`,
    };
    const resources = {
      ...makeResources([], [marketMaryRule]),
      people: [...repo.people],
    };
    const resolved = await resolveTransaction(
      firstParsedOf(emailConSaludo),
      emailConSaludo,
      repo,
      resources,
    );
    expect(repo.people).toHaveLength(1);
    expect(resolved.personId).toBe("person-existing");
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
      people: [],
    };
    const calls: string[] = [];
    const categoryService: CategoryService = {
      async categorize(merchant) {
        calls.push(merchant);
        return "cat-farmacia";
      },
      async categorizeMany(merchants) {
        return merchants.map((m) => {
          calls.push(m);
          return "cat-farmacia";
        });
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
      async categorizeMany(merchants) {
        return merchants.map(() => "cat-ia");
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
      async categorizeMany(merchants) {
        return merchants.map(() => null);
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
it("auto-crea la cuenta cuando la transacción trae accountLast4", async () => {
    const repo = new FakeRepository();
    const resources = makeResources([], []);
    const resolved = await resolveTransaction(
      {
        bank: "INTERBANK",
        transactionType: "transfer",
        paymentMethod: "bank_account",
        amount: 1000,
        currency: "PEN",
        transactionDate: "2026-08-11",
        accountLast4: "1732",
      },
      interbankPagoEmail,
      repo,
      resources,
    );
    expect(repo.accounts).toHaveLength(1);
    expect(repo.accounts[0].name).toBe("Cuenta INTERBANK ****1732");
    expect(resolved.accountId).toBe(repo.accounts[0].id);
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

  it("auto-crea la tarjeta en runSync cuando es desconocida", async () => {
    const repo = new FakeRepository();
    const result = await runSync({
      userId: "u1",
      repository: repo,
      provider: providerWith([bcpConsumoEmail]),
    });
    expect(result.transactionsCreated).toBe(1);
    expect(repo.cards).toHaveLength(1);
    expect(repo.cards[0].name).toBe("BCP ****8795");
    expect(repo.stored[0].card_id).toBe(repo.cards[0].id);
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