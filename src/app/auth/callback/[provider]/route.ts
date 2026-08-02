import { createClient } from "@connectrpc/connect";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { AuthService } from "@/shared/api/gen/contracts/generic/auth/v1/service/auth_service_pb";
import { createServerTransport } from "@/shared/api/server/transport";
import { createAuthCookieOptions } from "@/shared/auth/cookies";

const providers = new Set(["google", "facebook"]);

export async function GET(request: Request, context: { params: Promise<{ provider: string }> }) {
  const { provider } = await context.params;
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const cookieStore = await cookies();
  const storedState = cookieStore.get("fitai_oauth_state")?.value;

  if (!providers.has(provider) || !code || !state) {
    return NextResponse.redirect(new URL("/login?error=missing_code", origin));
  }

  if (!storedState || storedState !== state) {
    return NextResponse.redirect(new URL("/login?error=invalid_state", origin));
  }

  try {
    const client = createClient(AuthService, createServerTransport());
    const result = await client.loginWithOAuth({
      code,
      provider,
      redirectUri: `${origin}/auth/callback/${provider}`,
      state,
    });
    const response = NextResponse.redirect(new URL("/onboarding", origin));
    response.cookies.set("fitai_access_token", result.accessToken, {
      ...createAuthCookieOptions({ maxAge: 60 * 15 }),
    });
    response.cookies.set("fitai_refresh_token", result.refreshToken, {
      ...createAuthCookieOptions({ maxAge: 60 * 60 * 24 * 30 }),
    });
    response.cookies.set("fitai_user_id", result.userId, {
      ...createAuthCookieOptions({ maxAge: 60 * 60 * 24 * 30 }),
    });
    response.cookies.delete("fitai_oauth_state");
    return response;
  } catch {
    return NextResponse.redirect(new URL("/login?error=callback_failed", origin));
  }
}
