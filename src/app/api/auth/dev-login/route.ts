import { NextResponse } from "next/server";

import { createAuthCookieOptions } from "@/shared/auth/cookies";

export async function GET(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return new NextResponse("Not Found", { status: 404 });
  }

  const { searchParams, origin } = new URL(request.url);
  const target = searchParams.get("target") ?? "new";

  const dest = target === "existing" ? "/planning" : "/onboarding";
  const userId = target === "existing" ? "dev_user_existing" : "dev_user_new";

  const response = NextResponse.redirect(new URL(dest, origin));

  response.cookies.set("fitai_access_token", `mock_dev_access_token_${userId}`, createAuthCookieOptions({ maxAge: 60 * 60 }));
  response.cookies.set("fitai_refresh_token", `mock_dev_refresh_token_${userId}`, createAuthCookieOptions({ maxAge: 60 * 60 * 24 }));
  response.cookies.set("fitai_user_id", userId, createAuthCookieOptions({ maxAge: 60 * 60 * 24 }));

  console.info(`[dev-login] Mock login triggered for target=${target} -> dest=${dest}`);

  return response;
}
