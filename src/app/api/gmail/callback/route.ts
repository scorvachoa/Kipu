import { exchangeCodeForTokens } from "@/lib/gmail/oauth";
import { createGmailClient, getGmailProfile } from "@/lib/gmail/service";
import { encryptToken } from "@/lib/security/tokens";
import {
  consumeOAuthState,
  saveGmailConnection,
} from "@/lib/supabase/gmail-adapter";

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const hasError = searchParams.get("error") !== null;

  if (hasError || !code || !state) {
    return Response.redirect(`${appUrl()}/settings?gmail=error`);
  }

  try {
    const userId = await consumeOAuthState(state);
    if (!userId) {
      return Response.redirect(`${appUrl()}/settings?gmail=error`);
    }

    const tokens = await exchangeCodeForTokens(code);
    if (!tokens.refresh_token) {
      return Response.redirect(`${appUrl()}/settings?gmail=error`);
    }

    const refreshTokenEncrypted = encryptToken(tokens.refresh_token);

    const emailAddress = await getGmailProfile(
      createGmailClient(tokens.refresh_token),
    );

    await saveGmailConnection(userId, {
      emailAddress,
      scope: tokens.scope ?? "",
      refreshTokenEncrypted,
    });

    return Response.redirect(`${appUrl()}/dashboard?gmail=connected`);
  } catch {
    return Response.redirect(`${appUrl()}/settings?gmail=error`);
  }
}