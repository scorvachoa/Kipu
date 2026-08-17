export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
}

export interface TelegramMessage {
  message_id: number;
  chat: TelegramChat;
  from?: TelegramUser;
  text?: string;
  date: number;
}

export interface TelegramChat {
  id: number;
  type: string;
  first_name?: string;
  username?: string;
}

export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface TelegramLink {
  id: string;
  user_id: string;
  telegram_user_id: string;
  notify_new_expenses: boolean;
  notify_payments: boolean;
  notify_needs_review: boolean;
  created_at: string;
  updated_at: string;
}

export interface TelegramNotificationPrefs {
  notify_new_expenses?: boolean;
  notify_payments?: boolean;
  notify_needs_review?: boolean;
}