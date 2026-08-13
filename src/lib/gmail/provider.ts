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
}

export function createGmailEmailsProvider(
  options: GmailEmailsProviderOptions,
): SyncEmailsProvider {
  return {
    async fetchEmails(): Promise<EmailEnvelope[]> {
      const gmail = createGmailClient(options.refreshToken);
      const envelopes: EmailEnvelope[] = [];
      const seen = new Set<string>();
      let pageToken: string | undefined;

      do {
        const page = await listMessages(gmail, {
          query: options.query,
          maxResults: options.maxResults ?? 100,
          pageToken,
        });

        for (const message of page.messages ?? []) {
          const id = message.id;
          if (!id || seen.has(id)) {
            continue;
          }
          seen.add(id);
          envelopes.push(await getMessage(gmail, id));
        }

        pageToken = page.nextPageToken ?? undefined;
      } while (pageToken);

      return envelopes;
    },
  };
}