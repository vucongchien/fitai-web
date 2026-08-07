import { createClient } from "@connectrpc/connect";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { AuthService } from "@/shared/api/gen/contracts/generic/auth/v1/service/auth_service_pb";
import { ProfileService } from "@/shared/api/gen/contracts/supporting/profile/v1/service/profile_service_pb";
import { createServerTransport } from "@/shared/api/server/transport";
import { createAuthCookieOptions } from "@/shared/auth/cookies";
import { buildErrorPopupHtml, buildPopupHtml } from "@/shared/auth/popup-html";
import { resolveEntryRoute } from "@/shared/auth/route-decision";

const VALID_PROVIDERS = new Set(["google", "facebook"]);

async function resolvePostLoginRoute(accessToken: string, userId: string): Promise<string> {
  if (!process.env.FITAI_RPC_URL) {
    return "/onboarding";
  }

  try {
    const client = createClient(ProfileService, createServerTransport(accessToken));
    const profile = await client.getProfile({ userId });
    return resolveEntryRoute({
      hasActiveRoadmap: false,
      hasValidSession: true,
      profileCompletionRate: profile.completionRate,
    });
  } catch (error) {
    console.warn(`[oauth/callback] getProfile failed userId=${userId}`, error);
    return "/onboarding";
  }
}

export async function GET(request: Request, context: { params: Promise<{ provider: string }> }) {
  const { provider } = await context.params;
  const { origin } = new URL(request.url);
  const cookieStore = await cookies();
  const storedState = cookieStore.get("fitai_oauth_state")?.value;
  const isPopup = cookieStore.get("fitai_oauth_popup")?.value === "1";

  const code = new URL(request.url).searchParams.get("code");
  const state = new URL(request.url).searchParams.get("state");

  function fail(errorCode: string): NextResponse {
    if (isPopup) {
      return buildErrorPopupHtml(errorCode, origin);
    }
    return NextResponse.redirect(new URL(`/login?error=${errorCode}`, origin));
  }

  if (!VALID_PROVIDERS.has(provider)) {
    return fail("invalid_provider");
  }
  if (!code || !state) {
    console.warn(`[oauth/callback] missing code/state provider=${provider}`);
    return fail("missing_code");
  }
  if (!storedState || storedState !== state) {
    console.warn(`[oauth/callback] state mismatch provider=${provider}`);
    return fail("invalid_state");
  }

  try {
    const client = createClient(AuthService, createServerTransport());
    const redirectUri = `${origin}/auth/callback/${provider}`;
    const result = await client.loginWithOAuth({ code, provider, redirectUri, state });

    console.info(`[oauth/callback] login ok userId=${result.userId}`);

    const dest = await resolvePostLoginRoute(result.accessToken, result.userId);
    const response = isPopup
      ? buildPopupHtml(dest, origin)
      : NextResponse.redirect(new URL(dest, origin));

    response.cookies.set(
      "fitai_access_token",
      result.accessToken,
      createAuthCookieOptions({ maxAge: 60 * 15 }),
    );
    response.cookies.set(
      "fitai_refresh_token",
      result.refreshToken,
      createAuthCookieOptions({ maxAge: 60 * 60 * 24 * 30 }),
    );
    response.cookies.set(
      "fitai_user_id",
      result.userId,
      createAuthCookieOptions({ maxAge: 60 * 60 * 24 * 30 }),
    );
    response.cookies.delete("fitai_oauth_state");
    response.cookies.delete("fitai_oauth_popup");

    return response;
  } catch (error) {
    console.error(`[oauth/callback] loginWithOAuth failed provider=${provider}`, error);
    return fail("callback_failed");
  }
}
