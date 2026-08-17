export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          display_name: string | null;
          timezone: string;
          currency: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          display_name?: string | null;
          timezone?: string;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      people: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["people"]["Insert"]>;
        Relationships: [];
      };
      cards: {
        Row: {
          id: string;
          user_id: string;
          bank: string;
          name: string;
          card_type: string;
          last4: string;
          owner_person_id: string | null;
          currency: string;
          closing_day: number | null;
          payment_day: number | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          bank: string;
          name: string;
          card_type: string;
          last4: string;
          owner_person_id?: string | null;
          currency?: string;
          closing_day?: number | null;
          payment_day?: number | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["cards"]["Insert"]>;
        Relationships: [];
      };
      accounts: {
        Row: {
          id: string;
          user_id: string;
          bank: string;
          name: string;
          account_type: string;
          last4: string | null;
          owner_person_id: string | null;
          currency: string;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          bank: string;
          name: string;
          account_type?: string;
          last4?: string | null;
          owner_person_id?: string | null;
          currency?: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["accounts"]["Insert"]>;
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          person_id: string | null;
          card_id: string | null;
          account_id: string | null;
          bank: string;
          transaction_type: string;
          payment_method: string;
          amount: number;
          currency: string;
          transaction_date: string;
          transaction_time: string | null;
          merchant: string | null;
          normalized_merchant: string | null;
          category_id: string | null;
          description: string | null;
          operation_number: string | null;
          fingerprint: string | null;
          gmail_message_id: string | null;
          gmail_thread_id: string | null;
          source: string;
          raw_reference: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          person_id?: string | null;
          card_id?: string | null;
          account_id?: string | null;
          bank: string;
          transaction_type: string;
          payment_method: string;
          amount: number;
          currency?: string;
          transaction_date: string;
          transaction_time?: string | null;
          merchant?: string | null;
          normalized_merchant?: string | null;
          category_id?: string | null;
          description?: string | null;
          operation_number?: string | null;
          fingerprint?: string | null;
          gmail_message_id?: string | null;
          gmail_thread_id?: string | null;
          source: string;
          raw_reference?: string | null;
          status: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["transactions"]["Insert"]>;
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          icon: string | null;
          color: string | null;
          parent_id: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          icon?: string | null;
          color?: string | null;
          parent_id?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
        Relationships: [];
      };
      merchant_rules: {
        Row: {
          id: string;
          user_id: string;
          merchant_pattern: string;
          category_id: string;
          priority: number;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          merchant_pattern: string;
          category_id: string;
          priority?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["merchant_rules"]["Insert"]>;
        Relationships: [];
      };
      gmail_connections: {
        Row: {
          id: string;
          user_id: string;
          email_address: string | null;
          refresh_token_encrypted: string;
          scope: string;
          last_sync_at: string | null;
          revoked_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          email_address?: string | null;
          refresh_token_encrypted: string;
          scope?: string;
          last_sync_at?: string | null;
          revoked_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["gmail_connections"]["Insert"]>;
        Relationships: [];
      };
      telegram_links: {
        Row: {
          id: string;
          user_id: string;
          telegram_user_id: string;
          notify_new_expenses: boolean;
          notify_payments: boolean;
          notify_needs_review: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          telegram_user_id: string;
          notify_new_expenses?: boolean;
          notify_payments?: boolean;
          notify_needs_review?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["telegram_links"]["Insert"]>;
        Relationships: [];
      };
      sync_logs: {
        Row: {
          id: string;
          user_id: string;
          started_at: string;
          finished_at: string | null;
          status: string;
          emails_found: number;
          emails_processed: number;
          transactions_created: number;
          duplicates_found: number;
          requires_review: number;
          errors: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          started_at?: string;
          finished_at?: string | null;
          status?: string;
          emails_found?: number;
          emails_processed?: number;
          transactions_created?: number;
          duplicates_found?: number;
          requires_review?: number;
          errors?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["sync_logs"]["Insert"]>;
        Relationships: [];
      };
      oauth_states: {
        Row: {
          id: string;
          token: string;
          user_id: string;
          created_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          token: string;
          user_id: string;
          created_at?: string;
          expires_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["oauth_states"]["Insert"]>;
        Relationships: [];
      };
      telegram_link_codes: {
        Row: {
          id: string;
          code: string;
          user_id: string;
          created_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          user_id: string;
          created_at?: string;
          expires_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["telegram_link_codes"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}