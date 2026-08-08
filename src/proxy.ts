import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { createAuthCookieOptions } from "@/shared/auth/cookies";
import { refreshSessionTokens } from "@/shared/auth/refresh";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let accessToken = request.cookies.get("fitai_access_token")?.value;
  const refreshToken = request.cookies.get("fitai_refresh_token")?.value;

  const isPublicRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname.includes(".");

  if (!isPublicRoute && !accessToken) {
    if (refreshToken) {
      try {
        const refreshed = await refreshSessionTokens(refreshToken);

        const requestHeaders = new Headers(request.headers);
        const reqCookies = request.cookies.getAll();
        const updatedCookies = reqCookies.map((c) => {
          if (c.name === "fitai_access_token") {
            return `${c.name}=${refreshed.accessToken}`;
          }
          if (c.name === "fitai_refresh_token") {
            return `${c.name}=${refreshed.refreshToken}`;
          }
          return `${c.name}=${c.value}`;
        });

        if (!reqCookies.some((c) => c.name === "fitai_access_token")) {
          updatedCookies.push(`fitai_access_token=${refreshed.accessToken}`);
        }
        if (!reqCookies.some((c) => c.name === "fitai_refresh_token")) {
          updatedCookies.push(`fitai_refresh_token=${refreshed.refreshToken}`);
        }

        requestHeaders.set("cookie", updatedCookies.join("; "));

        const response = NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });

        response.cookies.set(
          "fitai_access_token",
          refreshed.accessToken,
          createAuthCookieOptions({ maxAge: 60 * 15 }),
        );
        response.cookies.set(
          "fitai_refresh_token",
          refreshed.refreshToken,
          createAuthCookieOptions({ maxAge: 60 * 60 * 24 * 30 }),
        );

        return response;
      } catch (error) {
        console.warn("[proxy] Token refresh failed:", error);
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        const response = NextResponse.redirect(loginUrl);
        response.cookies.delete("fitai_access_token");
        response.cookies.delete("fitai_refresh_token");
        response.cookies.delete("fitai_user_id");
        return response;
      }
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
