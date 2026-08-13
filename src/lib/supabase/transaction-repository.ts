import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { TransactionRepository } from "@/lib/email/repositories";
import type { Account, Card } from "@/types/cards";
import type { MerchantRule } from "@/types/categories";

export function createTransactionRepository(
  client: SupabaseClient<Database>,
  userId: string,
): TransactionRepository {
  return {
    async listCards() {
      const { data, error } = await client
        .from("cards")
        .select("*")
        .eq("user_id", userId);
      if (error) {
        throw error;
      }
      return (data ?? []) as Card[];
    },

    async listAccounts() {
      const { data, error } = await client
        .from("accounts")
        .select("*")
        .eq("user_id", userId);
      if (error) {
        throw error;
      }
      return (data ?? []) as Account[];
    },

    async listRules() {
      const { data, error } = await client
        .from("merchant_rules")
        .select("*")
        .eq("user_id", userId);
      if (error) {
        throw error;
      }
      return (data ?? []) as MerchantRule[];
    },

    async existsByGmailMessageId(messageId) {
      const { data, error } = await client
        .from("transactions")
        .select("id")
        .eq("user_id", userId)
        .eq("gmail_message_id", messageId)
        .maybeSingle();
      if (error) {
        throw error;
      }
      return data !== null;
    },

    async existsByOperation(bank, operationNumber) {
      const { data, error } = await client
        .from("transactions")
        .select("id")
        .eq("user_id", userId)
        .eq("bank", bank)
        .eq("operation_number", operationNumber)
        .maybeSingle();
      if (error) {
        throw error;
      }
      return data !== null;
    },

    async existsByFingerprint(fingerprint) {
      const { data, error } = await client
        .from("transactions")
        .select("id")
        .eq("user_id", userId)
        .eq("fingerprint", fingerprint)
        .maybeSingle();
      if (error) {
        throw error;
      }
      return data !== null;
    },

    async insertTransaction(transaction) {
      const { error } = await client
        .from("transactions")
        .insert(transaction as never);
      if (error) {
        throw error;
      }
    },
  };
}