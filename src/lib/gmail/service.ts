import { google } from "googleapis";
import type { gmail_v1 } from "googleapis";
import type { GmailMessageEnvelope, GmailQueryOptions } from "@/types/gmail";

export function createGmailClient(refreshToken: string) {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );
  auth.setCredentials({ refresh_token: refreshToken });
  return google.gmail({ version: "v1", auth });
}

export type GmailClient = ReturnType<typeof createGmailClient>;

export async function getGmailProfile(gmail: GmailClient): Promise<string | null> {
  const { data } = await gmail.users.getProfile({ userId: "me" });
  return data.emailAddress ?? null;
}

export async function listMessages(
  gmail: GmailClient,
  options: GmailQueryOptions,
) {
  const response = await gmail.users.messages.list({
    userId: "me",
    q: options.query,
    maxResults: options.maxResults,
    pageToken: options.pageToken,
  });
  return response.data;
}

export async function getMessage(
  gmail: GmailClient,
  messageId: string,
): Promise<GmailMessageEnvelope> {
  const { data } = await gmail.users.messages.get({
    userId: "me",
    id: messageId,
    format: "full",
  });

  const headers = Object.fromEntries(
    (data.payload?.headers ?? []).map((header) => [
      header.name?.toLowerCase() ?? "",
      header.value ?? "",
    ]),
  );

  return {
    id: data.id ?? messageId,
    threadId: data.threadId ?? messageId,
    internalDate: data.internalDate ?? "",
    from: headers["from"] ?? "",
    subject: headers["subject"] ?? "",
    html: extractPart(data.payload, "text/html"),
    text: extractPart(data.payload, "text/plain"),
  };
}

function extractPart(
  payload: gmail_v1.Schema$MessagePart | undefined,
  mimeType: "text/html" | "text/plain",
): string | undefined {
  if (!payload) {
    return undefined;
  }

  if (payload.mimeType === mimeType && payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  for (const part of payload.parts ?? []) {
    const result = extractPart(part, mimeType);
    if (result !== undefined) {
      return result;
    }
  }

  return undefined;
}

function decodeBase64Url(data: string): string {
  const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized, "base64").toString("utf8");
}