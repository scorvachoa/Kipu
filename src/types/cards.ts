import type { BankingBank, CardType, Currency } from "./shared";

export interface Person {
  id: string;
  user_id: string;
  name: string;
  type: "owner" | "other";
  created_at: string;
  updated_at: string;
}

export interface Card {
  id: string;
  user_id: string;
  bank: BankingBank;
  name: string;
  card_type: CardType;
  last4: string;
  owner_person_id: string | null;
  currency: Currency;
  closing_day: number | null;
  payment_day: number | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  user_id: string;
  bank: BankingBank;
  name: string;
  account_type: string;
  last4: string | null;
  owner_person_id: string | null;
  currency: Currency;
  active: boolean;
  created_at: string;
  updated_at: string;
}