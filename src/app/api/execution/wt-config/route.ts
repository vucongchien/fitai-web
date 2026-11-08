import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { createAuthCookieOptions } from "@/shared/auth/cookies";
import { refreshSessionTokens } from "@/shared/auth/refresh";

export async function GET() {
  const backendUrl =
    process.env.FITAI_CORE_URL || process.env.FITAI_RPC_URL || "http://localhost:8080";
  try {
    const cookieStore = await cookies();
    let accessToken = cookieStore.get("fitai_access_token")?.value;
    const refreshToken = cookieStore.get("fitai_refresh_token")?.value;

    const tryRefresh = async (): Promise<string | undefined> => {
      if (!refreshToken) {
        return undefined;
      }
      try {
        const refreshed = await refreshSessionTokens(refreshToken);
        cookieStore.set(
          "fitai_access_token",
          refreshed.accessToken,
          createAuthCookieOptions({ maxAge: 60 * 15 }),
        );
        cookieStore.set(
          "fitai_refresh_token",
          refreshed.refreshToken,
          createAuthCookieOptions({ maxAge: 60 * 60 * 24 * 30 }),
        );
        return refreshed.accessToken;
      } catch {
        cookieStore.delete("fitai_access_token");
        cookieStore.delete("fitai_refresh_token");
        cookieStore.delete("fitai_user_id");
        return undefined;
      }
    };

    if (!accessToken && refreshToken) {
      accessToken = await tryRefresh();
    }

    if (!accessToken) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const fetchConfig = (token: string) =>
      fetch(`${backendUrl}/api/v1/execution/wt-config?token=${encodeURIComponent(token)}`, {
        cache: "no-store",
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

    let res = await fetchConfig(accessToken);

    if (res.status === 401 && refreshToken) {
      const refreshedToken = await tryRefresh();
      if (refreshedToken) {
        accessToken = refreshedToken;
        res = await fetchConfig(accessToken);
      }
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch wt-config from backend" },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json({
      ...data,
      token: accessToken,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Backend wt-config unreachable",
        message: err instanceof Error ? err.message : String(err),
      },
      { status: 502 },
    );
  }
}
