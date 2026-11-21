import { createClient } from "@connectrpc/connect";
import { NextResponse } from "next/server";

import { AuthService } from "@/shared/api/gen/contracts/generic/auth/v1/service/auth_service_pb";
import { Gender } from "@/shared/api/gen/contracts/generic/auth/v1/message/auth_messages_pb";
import { createServerTransport } from "@/shared/api/server/transport";
import { createAuthCookieOptions } from "@/shared/auth/cookies";

const DEV_ACCOUNTS = {
  existing: {
    identifier: process.env.DEV_EXISTING_EMAIL || "dev-existing@fitai.local",
    password: process.env.DEV_EXISTING_PASSWORD || "DevPassword123!",
    dest: "/home",
  },
  new: {
    identifier: process.env.DEV_NEW_EMAIL || "dev-new@fitai.local",
    password: process.env.DEV_NEW_PASSWORD || "DevPassword123!",
    dest: "/onboarding",
  },
  user2: {
    identifier: process.env.DEV_USER2_EMAIL || "dev-user2@fitai.local",
    password: process.env.DEV_USER2_PASSWORD || "DevPassword123!",
    dest: "/onboarding",
  },
} as const;

export async function GET(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return new NextResponse("Not Found", { status: 404 });
  }

  const { searchParams, origin } = new URL(request.url);
  const targetParam = searchParams.get("target");
  const target =
    targetParam === "existing" ? "existing" : targetParam === "user2" ? "user2" : "new";
  const account = DEV_ACCOUNTS[target];

  const client = createClient(AuthService, createServerTransport());

  let accessToken = "";
  let refreshToken = "";
  let userId = "";

  try {
    const loginRes = await client.login({
      identifier: account.identifier,
      password: account.password,
    });
    accessToken = loginRes.accessToken;
    refreshToken = loginRes.refreshToken;
    userId = loginRes.userId;
  } catch {
    try {
      await client.register({
        identifier: account.identifier,
        password: account.password,
        fullName:
          target === "existing"
            ? "Dev Existing User"
            : target === "user2"
              ? "Dev User 2"
              : "Dev New User",
        gender: Gender.MALE,
        dateOfBirth: "2000-01-01",
      });
      const loginAfterReg = await client.login({
        identifier: account.identifier,
        password: account.password,
      });
      accessToken = loginAfterReg.accessToken;
      refreshToken = loginAfterReg.refreshToken;
      userId = loginAfterReg.userId;
    } catch (regError: any) {
      console.error(
        "[dev-login] Failed to authenticate with backend:",
        regError?.message || regError,
      );
      return NextResponse.json(
        {
          error: "DEV_LOGIN_FAILED",
          message: "Failed to authenticate dev user with backend",
        },
        { status: 502 },
      );
    }
  }

  if (!accessToken || !userId) {
    return NextResponse.json(
      { error: "DEV_LOGIN_FAILED", message: "Backend did not return accessToken or userId" },
      { status: 502 },
    );
  }

  const response = NextResponse.redirect(new URL(account.dest, origin));

  response.cookies.set(
    "fitai_access_token",
    accessToken,
    createAuthCookieOptions({ maxAge: 60 * 60 }),
  );
  response.cookies.set(
    "fitai_refresh_token",
    refreshToken,
    createAuthCookieOptions({ maxAge: 60 * 60 * 24 }),
  );
  response.cookies.set("fitai_user_id", userId, createAuthCookieOptions({ maxAge: 60 * 60 * 24 }));

  console.info(
    `[dev-login] Authenticated real backend user=${userId} target=${target} -> dest=${account.dest}`,
  );

  return response;
}
