export interface GmailConnection {
  id: string;
  user_id: string;
  email_address: string | null;
  refresh_token_encrypted: string;
  scope: string;
  last_sync_at: string | null;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface GmailQueryOptions {
  query: string;
  maxResults?: number;
  pageToken?: string;
}

export interface GmailMessageEnvelope {
  id: string;
  threadId: string;
  internalDate: string;
  from: string;
  subject: string;
  html?: string;
  text?: string;
}

export interface GmailSyncResult {
  emailsFound: number;
  emailsProcessed: number;
  transactionsCreated: number;
  duplicatesFound: number;
  requiresReview: number;
  errors: number;
}