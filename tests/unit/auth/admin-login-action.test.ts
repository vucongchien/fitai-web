import { Code, ConnectError } from "@connectrpc/connect";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockLogin = vi.fn();
const mockLogout = vi.fn();
const mockCookieSet = vi.fn();

vi.mock("@connectrpc/connect", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@connectrpc/connect")>();
  return {
    ...actual,
    createClient: () => ({
      login: mockLogin,
      logout: mockLogout,
    }),
  };
});

vi.mock("next/headers", () => ({
  cookies: async () => ({
    set: mockCookieSet,
    get: vi.fn(),
  }),
}));

vi.mock("@/shared/api/server/transport", () => ({
  createServerTransport: vi.fn(() => ({})),
}));

import { adminLoginAction } from "@/features/auth/server/auth-actions";

function makeJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${header}.${body}.sig`;
}

describe("adminLoginAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("FITAI_RPC_URL", "http://localhost:8000");
    mockLogout.mockResolvedValue({});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("rejects non-admin accounts without persisting cookies and revokes refresh token", async () => {
    mockLogin.mockResolvedValueOnce({
      accessToken: makeJwt({ sub: "u-1", role: "user" }),
      refreshToken: "rt-user",
      userId: "u-1",
    });

    const result = await adminLoginAction("athlete@fitai.local", "Secret123!", "/admin/users");

    expect(result).toEqual({
      success: false,
      code: "FORBIDDEN",
      error: "This account does not have administrator privileges.",
    });
    expect(mockCookieSet).not.toHaveBeenCalled();
    expect(mockLogout).toHaveBeenCalledWith({ refreshToken: "rt-user" });
  });

  it("persists session cookies and redirects to safe /admin path for admin accounts", async () => {
    const adminToken = makeJwt({ sub: "admin-1", role: "admin" });
    mockLogin.mockResolvedValueOnce({
      accessToken: adminToken,
      refreshToken: "rt-admin",
      userId: "admin-1",
    });

    const result = await adminLoginAction("admin@fitai.local", "Admin@123456", "/admin/exercises");

    expect(result).toEqual({
      success: true,
      data: { redirectUrl: "/admin/exercises" },
    });
    expect(mockCookieSet).toHaveBeenCalledWith(
      "fitai_access_token",
      adminToken,
      expect.any(Object),
    );
    expect(mockCookieSet).toHaveBeenCalledWith(
      "fitai_refresh_token",
      "rt-admin",
      expect.any(Object),
    );
    expect(mockCookieSet).toHaveBeenCalledWith("fitai_user_id", "admin-1", expect.any(Object));
  });

  it("sanitizes unsafe redirect targets back to /admin", async () => {
    mockLogin.mockResolvedValueOnce({
      accessToken: makeJwt({ sub: "admin-1", role: "ADMIN" }),
      refreshToken: "rt-admin",
      userId: "admin-1",
    });

    const result = await adminLoginAction("admin@fitai.local", "Admin@123456", "//evil.com/phish");

    expect(result).toEqual({
      success: true,
      data: { redirectUrl: "/admin" },
    });
  });

  it("returns SERVICE_UNAVAILABLE when backend cannot be reached", async () => {
    mockLogin.mockRejectedValueOnce(new ConnectError("fetch failed", Code.Unavailable));

    const result = await adminLoginAction("admin@fitai.local", "Admin@123456");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe("SERVICE_UNAVAILABLE");
      expect(result.error).toMatch(/Cannot reach authentication server/i);
    }
  });
});
