import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { createAuthCookieOptions } from "@/shared/auth/cookies";
import { refreshSessionTokens } from "@/shared/auth/refresh";
import { detectSubdomain, resolveSubdomainRewrite } from "@/shared/routing/subdomain";

const STATIC_EXT_REGEX =
  /\.(ico|png|jpg|jpeg|svg|webp|gif|woff2?|ttf|css|m?js|map|wasm|onnx|webmanifest|mp4)$/i;

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host");
  const subdomain = detectSubdomain(host);
  const rewritePath = resolveSubdomainRewrite(host, pathname);
  const effectivePathname = rewritePath ?? pathname;

  let accessToken = request.cookies.get("fitai_access_token")?.value;
  const refreshToken = request.cookies.get("fitai_refresh_token")?.value;

  const isPublicRoute =
    (subdomain === "main" && effectivePathname === "/") ||
    effectivePathname === "/partner" ||
    effectivePathname === "/lab" ||
    effectivePathname.startsWith("/lab/") ||
    effectivePathname === "/guides" ||
    effectivePathname.startsWith("/guides/") ||
    effectivePathname === "/robots.txt" ||
    effectivePathname === "/sitemap.xml" ||
    effectivePathname === "/llms.txt" ||
    effectivePathname === "/llms-full.txt" ||
    effectivePathname === "/feed.xml" ||
    effectivePathname === "/knowledge.json" ||
    effectivePathname === "/fitai-indexnow-20261115.txt" ||
    effectivePathname.startsWith("/opengraph-image") ||
    effectivePathname.startsWith("/twitter-image") ||
    effectivePathname.startsWith("/login") ||
    effectivePathname.startsWith("/auth") ||
    effectivePathname.startsWith("/api/auth") ||
    effectivePathname.startsWith("/api/execution") ||
    effectivePathname.startsWith("/workouts/live/ai-12-exercises") ||
    effectivePathname.startsWith("/_next") ||
    effectivePathname.startsWith("/ort/") ||
    effectivePathname.startsWith("/models/") ||
    effectivePathname === "/favicon.ico" ||
    STATIC_EXT_REGEX.test(effectivePathname);

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

        const response = rewritePath
          ? NextResponse.rewrite(new URL(rewritePath, request.url), {
              request: {
                headers: requestHeaders,
              },
            })
          : NextResponse.next({
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
        if (pathname.startsWith("/rpc") || pathname.startsWith("/api/")) {
          const apiResponse = NextResponse.json(
            { code: "unauthenticated", message: "Session expired, re-authentication required" },
            { status: 401 },
          );
          apiResponse.cookies.delete("fitai_access_token");
          apiResponse.cookies.delete("fitai_refresh_token");
          apiResponse.cookies.delete("fitai_user_id");
          return apiResponse;
        }

        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        const response = NextResponse.redirect(loginUrl);
        response.cookies.delete("fitai_access_token");
        response.cookies.delete("fitai_refresh_token");
        response.cookies.delete("fitai_user_id");
        return response;
      }
    }

    if (pathname.startsWith("/rpc") || pathname.startsWith("/api/")) {
      return NextResponse.json(
        { code: "unauthenticated", message: "Authentication required" },
        { status: 401 },
      );
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (rewritePath) {
    return NextResponse.rewrite(new URL(rewritePath, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
