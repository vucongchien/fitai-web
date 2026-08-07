import { createClient } from "@connectrpc/connect";
import { NextResponse } from "next/server";

import { AuthService } from "@/shared/api/gen/contracts/generic/auth/v1/service/auth_service_pb";
import { createServerTransport } from "@/shared/api/server/transport";
import { createAuthCookieOptions } from "@/shared/auth/cookies";

const providers = new Set(["google", "facebook"]);

export async function GET(request: Request, context: { params: Promise<{ provider: string }> }) {
  const { provider } = await context.params;
  const {origin} = new URL(request.url);
  if (!providers.has(provider))
    {return NextResponse.redirect(new URL("/login?error=invalid_provider", origin));}

  if (!process.env.FITAI_RPC_URL) {
    const response = NextResponse.redirect(new URL("/onboarding", origin));
    response.cookies.set("fitai_preview_session", provider, {
      ...createAuthCookieOptions({ maxAge: 60 * 60 * 8 }),
    });
    return response;
  }

  try {
    const client = createClient(AuthService, createServerTransport());
    const redirectUri = `${origin}/auth/callback/${provider}`;
    const result = await client.getOAuthLoginURL({ provider, redirectUri });
    const loginUrl = new URL(result.loginUrl);
    const state = loginUrl.searchParams.get("state");
    const response = NextResponse.redirect(loginUrl);
    if (state) {
      response.cookies.set("fitai_oauth_state", state, {
        ...createAuthCookieOptions({ maxAge: 60 * 10 }),
      });
    }
    return response;
  } catch {
    return NextResponse.redirect(new URL("/login?error=callback_failed", origin));
  }
}
