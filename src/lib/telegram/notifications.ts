import { createAdminClient } from "@/lib/supabase/admin";
import {
  listTelegramLinks,
} from "@/lib/supabase/telegram-adapter";
import { sendTelegramMessage } from "@/lib/telegram/client";
import {
  formatTransactionNotification,
  type TelegramTxNotification,
} from "@/lib/telegram/messages";
import type { NewTransaction } from "@/types/transactions";
import type { TransactionType } from "@/types/shared";

const EXPENSE_TYPES = new Set<TransactionType>([
  "purchase",
  "withdrawal",
  "transfer",
  "fee",
  "other",
]);

export interface TransactionNotificationResources {
  cardLabels: Map<string, string>;
  accountLabels: Map<string, string>;
  personNames: Map<string, string>;
  categoryNames: Map<string, string | null>;
  categoryIcons: Map<string, string | null>;
}

export async function loadTransactionNotificationResources(
  userId: string,
): Promise<TransactionNotificationResources> {
  const admin = createAdminClient();
  const [cards, accounts, people, categories] = await Promise.all([
    admin.from("cards").select("id, card_type, last4").eq("user_id", userId),
    admin.from("accounts").select("id, last4").eq("user_id", userId),
    admin.from("people").select("id, name").eq("user_id", userId),
    admin.from("categories").select("id, name, icon").eq("user_id", userId),
  ]);

  const cardLabels = new Map<string, string>();
  for (const card of cards.data ?? []) {
    const kind = card.card_type === "credit" ? "Crédito" : "Débito";
    cardLabels.set(card.id, `${kind} ****${card.last4}`);
  }

  const accountLabels = new Map<string, string>();
  for (const account of accounts.data ?? []) {
    if (account.last4) {
      accountLabels.set(account.id, `Cuenta ****${account.last4}`);
    }
  }

  const personNames = new Map<string, string>();
  for (const person of people.data ?? []) {
    personNames.set(person.id, person.name);
  }

  const categoryNames = new Map<string, string | null>();
  const categoryIcons = new Map<string, string | null>();
  for (const category of categories.data ?? []) {
    categoryNames.set(category.id, category.name);
    categoryIcons.set(category.id, category.icon);
  }

  return {
    cardLabels,
    accountLabels,
    personNames,
    categoryNames,
    categoryIcons,
  };
}

function cardLabelFor(
  tx: NewTransaction,
  resources: TransactionNotificationResources,
): string | null {
  if (tx.card_id) {
    return resources.cardLabels.get(tx.card_id) ?? null;
  }
  if (tx.account_id) {
    return resources.accountLabels.get(tx.account_id) ?? null;
  }
  return null;
}

function shouldNotifyAsExpense(tx: NewTransaction): boolean {
  return EXPENSE_TYPES.has(tx.transaction_type);
}

function notifiesKind(
  tx: NewTransaction,
  notifyNewExpenses: boolean,
  notifyPayments: boolean,
  notifyNeedsReview: boolean,
): boolean {
  if (tx.status === "needs_review") {
    return notifyNeedsReview;
  }
  if (tx.transaction_type === "payment") {
    return notifyPayments;
  }
  return notifyNewExpenses && shouldNotifyAsExpense(tx);
}

export async function notifyNewTransactions(
  userId: string,
  transactions: NewTransaction[],
): Promise<void> {
  if (transactions.length === 0) {
    return;
  }

  const links = await listTelegramLinks(userId);
  if (links.length === 0) {
    return;
  }

  const resources = await loadTransactionNotificationResources(userId);

  const messages = transactions
    .filter((tx) =>
      links.some((link) =>
        notifiesKind(
          tx,
          link.notify_new_expenses,
          link.notify_payments,
          link.notify_needs_review,
        ),
      ),
    )
    .map((tx) => toNotification(tx, resources));

  for (const link of links) {
    for (const message of messages) {
      await sendTelegramMessage(link.telegram_user_id, message);
    }
  }
}

function toNotification(
  tx: NewTransaction,
  resources: TransactionNotificationResources,
): string {
  const notification: TelegramTxNotification = {
    bank: tx.bank,
    merchant: tx.merchant,
    amount: tx.amount,
    currency: tx.currency,
    transaction_type: tx.transaction_type,
    transaction_date: tx.transaction_date,
    transaction_time: tx.transaction_time,
    status: tx.status,
    card_label: cardLabelFor(tx, resources),
    person_name: tx.person_id
      ? resources.personNames.get(tx.person_id) ?? null
      : null,
    category_name: tx.category_id
      ? resources.categoryNames.get(tx.category_id) ?? null
      : null,
    category_icon: tx.category_id
      ? resources.categoryIcons.get(tx.category_id) ?? null
      : null,
  };
  return formatTransactionNotification(notification);
}