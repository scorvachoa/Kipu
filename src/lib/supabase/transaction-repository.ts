import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { TransactionRepository } from "@/lib/email/repositories";
import type { Account, Card, Person } from "@/types/cards";
import type { Category, MerchantRule } from "@/types/categories";

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

    async listCategories() {
      const { data, error } = await client
        .from("categories")
        .select("*")
        .eq("user_id", userId);
      if (error) {
        throw error;
      }
      return (data ?? []) as Category[];
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

    async insertCard(card) {
      const { data, error } = await client
        .from("cards")
        .insert({ ...card, user_id: userId } as never)
        .select("*")
        .single();
      if (error) {
        throw error;
      }
      return data as Card;
    },

    async insertAccount(account) {
      const { data, error } = await client
        .from("accounts")
        .insert({ ...account, user_id: userId } as never)
        .select("*")
        .single();
      if (error) {
        throw error;
      }
      return data as Account;
    },

    async listPeople() {
      const { data, error } = await client
        .from("people")
        .select("*")
        .eq("user_id", userId);
      if (error) {
        throw error;
      }
      return (data ?? []) as Person[];
    },

    async insertPerson(person) {
      const { data, error } = await client
        .from("people")
        .insert({ ...person, user_id: userId } as never)
        .select("*")
        .single();
      if (error) {
        throw error;
      }
      return data as Person;
    },
  };
}