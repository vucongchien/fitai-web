import { createClient } from "@connectrpc/connect";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { AuthService } from "@/shared/api/gen/contracts/generic/auth/v1/service/auth_service_pb";
import { createServerTransport } from "@/shared/api/server/transport";

const AUTH_COOKIES = [
  "fitai_access_token",
  "fitai_refresh_token",
  "fitai_user_id",
  "fitai_oauth_state",
  "fitai_oauth_popup",
] as const;

async function performLogout(request: Request) {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("fitai_refresh_token")?.value;
  const { origin } = new URL(request.url);

  if (refreshToken && process.env.FITAI_RPC_URL) {
    try {
      const client = createClient(AuthService, createServerTransport());
      await client.logout({ refreshToken });
      console.info("[auth/logout] successfully revoked refresh token on gRPC backend");
    } catch (error) {
      console.warn("[auth/logout] gRPC AuthService.Logout warning:", error);
    }
  }

  const acceptsHtml = request.headers.get("accept")?.includes("text/html");
  const isGet = request.method === "GET";

  const response =
    acceptsHtml || isGet
      ? NextResponse.redirect(new URL("/login", origin))
      : NextResponse.json({ success: true, message: "Logged out successfully" });

  for (const cookieName of AUTH_COOKIES) {
    response.cookies.delete(cookieName);
  }

  return response;
}

export async function POST(request: Request) {
  return performLogout(request);
}

export async function GET(request: Request) {
  return performLogout(request);
}
