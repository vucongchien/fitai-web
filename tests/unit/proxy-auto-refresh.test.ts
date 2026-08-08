import { create } from "@bufbuild/protobuf";
import type { Client, Transport } from "@connectrpc/connect";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RefreshTokenResponseSchema } from "@/shared/api/gen/contracts/generic/auth/v1/message/auth_messages_pb";
import type { AuthService } from "@/shared/api/gen/contracts/generic/auth/v1/service/auth_service_pb";

type AuthClient = Client<typeof AuthService>;

const mockRefreshToken = vi.fn<AuthClient["refreshToken"]>();

vi.mock<typeof import("@connectrpc/connect")>(import("@connectrpc/connect"), () => ({
  createClient: (_service: unknown, _transport: unknown) => ({
    refreshToken: mockRefreshToken,
  }),
}));

vi.mock<typeof import("@/shared/api/server/transport")>(
  import("@/shared/api/server/transport"),
  () => ({
    createServerTransport: vi.fn<() => Transport>(() => ({}) as Transport),
  }),
);

function makeNextRequest(url: string, cookiesRecord: Record<string, string> = {}) {
  const req = new NextRequest(new URL(url, "http://localhost:3000"));
  for (const [name, value] of Object.entries(cookiesRecord)) {
    req.cookies.set(name, value);
  }
  return req;
}

describe("Middleware Proxy Auto-refresh (src/proxy.ts)", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("FITAI_RPC_URL", "http://backend:8080");
    mockRefreshToken.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("allows public routes without authentication", async () => {
    const { proxy } = await import("@/proxy");
    const req = makeNextRequest("/login");
    const res = await proxy(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("redirects to /login when both access_token and refresh_token are absent on private route", async () => {
    const { proxy } = await import("@/proxy");
    const req = makeNextRequest("/home");
    const res = await proxy(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login?redirect=%2Fhome");
  });

  it("allows request to proceed when valid access_token is present", async () => {
    const { proxy } = await import("@/proxy");
    const req = makeNextRequest("/home", { fitai_access_token: "valid_access_token" });
    const res = await proxy(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
    expect(mockRefreshToken).not.toHaveBeenCalled();
  });

  it("auto-refreshes tokens when access_token is missing but refresh_token exists", async () => {
    mockRefreshToken.mockResolvedValue(
      create(RefreshTokenResponseSchema, {
        accessToken: "new_access_token_123",
        refreshToken: "new_refresh_token_456",
      }),
    );

    const { proxy } = await import("@/proxy");
    const req = makeNextRequest("/roadmap", { fitai_refresh_token: "existing_refresh_token" });
    const res = await proxy(req);

    expect(mockRefreshToken).toHaveBeenCalledTimes(1);
    expect(mockRefreshToken).toHaveBeenCalledWith({ refreshToken: "existing_refresh_token" });
    expect(res.status).toBe(200);

    const setCookieHeader = res.headers.get("set-cookie");
    expect(setCookieHeader).toContain("fitai_access_token=new_access_token_123");
    expect(setCookieHeader).toContain("fitai_refresh_token=new_refresh_token_456");
  });

  it("deletes cookies and redirects to /login when token refresh fails", async () => {
    mockRefreshToken.mockRejectedValue(new Error("Refresh token expired or revoked"));

    const { proxy } = await import("@/proxy");
    const req = makeNextRequest("/profile", { fitai_refresh_token: "expired_refresh_token" });
    const res = await proxy(req);

    expect(mockRefreshToken).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login?redirect=%2Fprofile");

    const setCookieHeader = res.headers.get("set-cookie");
    expect(setCookieHeader).toContain("fitai_access_token=;");
    expect(setCookieHeader).toContain("fitai_refresh_token=;");
  });
});
