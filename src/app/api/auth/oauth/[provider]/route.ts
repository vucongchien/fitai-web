import { createClient } from "@connectrpc/connect";
import { NextResponse } from "next/server";

import { AuthService } from "@/shared/api/gen/contracts/generic/auth/v1/service/auth_service_pb";
import { createServerTransport } from "@/shared/api/server/transport";
import { createAuthCookieOptions } from "@/shared/auth/cookies";
import { buildErrorPopupHtml, buildPopupHtml } from "@/shared/auth/popup-html";

const VALID_PROVIDERS = new Set(["google", "facebook"]);
const STATE_MAX_AGE = 60 * 10;
const POPUP_MAX_AGE = 60 * 10;

export async function GET(request: Request, context: { params: Promise<{ provider: string }> }) {
  const { provider } = await context.params;
  const { origin, searchParams } = new URL(request.url);
  const isPopup = searchParams.get("popup") === "1";

  function fail(code: string): NextResponse {
    if (isPopup) {
      return buildErrorPopupHtml(code, origin);
    }
    return NextResponse.redirect(new URL(`/login?error=${code}`, origin));
  }

  if (!VALID_PROVIDERS.has(provider)) {
    return fail("invalid_provider");
  }

  if (!process.env.FITAI_RPC_URL) {
    console.warn("[oauth/start] FITAI_RPC_URL not set");
    if (isPopup) {
      return buildPopupHtml("/onboarding", origin);
    }

    return NextResponse.redirect(new URL("/onboarding", origin));
  }

  try {
    const client = createClient(AuthService, createServerTransport());
    const redirectUri = `${origin}/auth/callback/${provider}`;
    const result = await client.getOAuthLoginURL({ provider, redirectUri });
    const loginUrl = new URL(result.loginUrl);
    const state = loginUrl.searchParams.get("state");

    const response = NextResponse.redirect(loginUrl, { status: 307 });

    if (state) {
      response.cookies.set(
        "fitai_oauth_state",
        state,
        createAuthCookieOptions({ maxAge: STATE_MAX_AGE }),
      );
    }
    if (isPopup) {
      response.cookies.set(
        "fitai_oauth_popup",
        "1",
        createAuthCookieOptions({ maxAge: POPUP_MAX_AGE }),
      );
    }

    return response;
  } catch (error) {
    console.error(`[oauth/start] provider=${provider}`, error);
    if (process.env.NODE_ENV === "development") {
      if (isPopup) {
        return buildPopupHtml("/onboarding", origin);
      }
      return NextResponse.redirect(new URL("/onboarding", origin));
    }
    return fail("callback_failed");
  }
}
