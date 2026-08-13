import type { EmailEnvelope } from "./bank-email-parser";
import type { GmailSyncResult } from "@/types/gmail";
import type { NewTransaction } from "@/types/transactions";
import type { TransactionStatus } from "@/types/shared";
import {
  buildTransactionFingerprint,
  loadResources,
  processEmail,
  type ResolvedTransaction,
} from "./processor";
import type { TransactionRepository } from "./repositories";

export interface SyncEmailsProvider {
  fetchEmails(): Promise<EmailEnvelope[]>;
}

export interface SyncDependencies {
  userId: string;
  repository: TransactionRepository;
  provider: SyncEmailsProvider;
}

export interface SyncOutcome extends GmailSyncResult {
  createdTransactions: NewTransaction[];
}

function isUniqueViolation(error: unknown): boolean {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23505"
  ) {
    return true;
  }
  return false;
}

export async function runSync(
  dependencies: SyncDependencies,
): Promise<SyncOutcome> {
  const { userId, repository, provider } = dependencies;
  const result: SyncOutcome = {
    emailsFound: 0,
    emailsProcessed: 0,
    transactionsCreated: 0,
    duplicatesFound: 0,
    requiresReview: 0,
    errors: 0,
    createdTransactions: [],
  };

  const emails = await provider.fetchEmails();
  result.emailsFound = emails.length;

  const resources = await loadResources(repository);

  for (const email of emails) {
    let outcome;
    try {
      outcome = await processEmail(email, repository, resources);
    } catch {
      result.errors += 1;
      continue;
    }

    if (!outcome.handled) {
      continue;
    }

    result.emailsProcessed += 1;

    if (outcome.transactions.length === 0) {
      result.errors += 1;
      continue;
    }

    for (const resolved of outcome.transactions) {
      if (resolved.duplicate) {
        result.duplicatesFound += 1;
        continue;
      }

      const transaction = buildTransactionRow(
        userId,
        email,
        resolved,
      );

      try {
        await repository.insertTransaction(transaction);
        result.transactionsCreated += 1;
        if (transaction.status === "needs_review") {
          result.requiresReview += 1;
        }
        result.createdTransactions.push(transaction);
      } catch (insertError) {
        if (isUniqueViolation(insertError)) {
          result.duplicatesFound += 1;
        } else {
          result.errors += 1;
        }
      }
    }
  }

  return result;
}

export function buildTransactionRow(
  userId: string,
  email: EmailEnvelope,
  resolved: ResolvedTransaction,
): NewTransaction {
  const { parsed, normalized } = resolved;

  return {
    user_id: userId,
    person_id: resolved.personId,
    card_id: resolved.cardId,
    account_id: resolved.accountId,
    bank: parsed.bank,
    transaction_type: parsed.transactionType,
    payment_method: parsed.paymentMethod,
    amount: parsed.amount,
    currency: normalized.currency,
    transaction_date: normalized.transactionDate,
    transaction_time: normalized.transactionTime,
    merchant: normalized.merchant,
    normalized_merchant: normalized.normalizedMerchant,
    category_id: resolved.categoryId,
    description: null,
    operation_number: normalized.operationNumber,
    fingerprint: buildTransactionFingerprint(parsed, normalized),
    gmail_message_id: email.id || null,
    gmail_thread_id: email.threadId || null,
    source: "gmail",
    raw_reference: null,
    status: resolved.status as TransactionStatus,
  };
}