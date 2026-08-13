import { getUser } from "@/lib/auth";
import { buildAuthUrl } from "@/lib/gmail/oauth";
import { error } from "@/lib/http";
import { createOAuthState } from "@/lib/supabase/gmail-adapter";

export async function GET() {
  const user = await getUser();
  if (!user) {
    return error("No autorizado", 401);
  }

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return error("OAuth de Gmail no configurado", 500);
  }

  const stateToken = await createOAuthState(user.id);
  const authUrl = buildAuthUrl(stateToken);

  return Response.redirect(authUrl);
}