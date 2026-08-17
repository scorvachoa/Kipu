import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Database } from "@/types/database";

const PROTECTED_PATHS = [
  "/dashboard",
  "/transactions",
  "/cards",
  "/categories",
  "/settings",
];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some((prefix) => pathname.startsWith(prefix));
}

function carryCookies(from: NextResponse, to: NextResponse): NextResponse {
  from.cookies.getAll().forEach(({ name, value, ...options }) => {
    to.cookies.set(name, value, { ...options, path: "/" });
  });
  return to;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response = NextResponse.next({ request });
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isProtectedPath(pathname) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return carryCookies(response, NextResponse.redirect(url));
  }

  if (pathname === "/login" && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return carryCookies(response, NextResponse.redirect(url));
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/transactions/:path*",
    "/cards/:path*",
    "/categories/:path*",
    "/settings/:path*",
    "/login",
  ],
};