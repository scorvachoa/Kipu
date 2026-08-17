import type { EmailEnvelope } from "@/lib/email/bank-email-parser";
import type { SyncEmailsProvider } from "@/lib/email/sync";
import {
  createGmailClient,
  getMessage,
  listMessages,
} from "./service";

export interface GmailEmailsProviderOptions {
  refreshToken: string;
  query: string;
  maxResults?: number;
  pageToken?: string;
}

export interface GmailEmailsProvider extends SyncEmailsProvider {
  nextPageToken: string | undefined;
}

export function createGmailEmailsProvider(
  options: GmailEmailsProviderOptions,
): GmailEmailsProvider {
  const gmail = createGmailClient(options.refreshToken);
  let nextPageToken: string | undefined;

  return {
    get nextPageToken() {
      return nextPageToken;
    },

    async fetchEmails(): Promise<EmailEnvelope[]> {
      const page = await listMessages(gmail, {
        query: options.query,
        maxResults: options.maxResults ?? 30,
        pageToken: options.pageToken,
      });

      const seen = new Set<string>();
      const envelopes: EmailEnvelope[] = [];
      for (const message of page.messages ?? []) {
        const id = message.id;
        if (!id || seen.has(id)) {
          continue;
        }
        seen.add(id);
        envelopes.push(await getMessage(gmail, id));
      }

      nextPageToken = page.nextPageToken ?? undefined;
      return envelopes;
    },
  };
}