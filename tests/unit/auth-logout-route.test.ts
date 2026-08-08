import { create } from "@bufbuild/protobuf";
import type { Client, Transport } from "@connectrpc/connect";


import { LogoutResponseSchema } from "@/shared/api/gen/contracts/generic/auth/v1/message/auth_messages_pb";
import type { AuthService } from "@/shared/api/gen/contracts/generic/auth/v1/service/auth_service_pb";

type AuthClient = Client<typeof AuthService>;

const mockCookieDelete = vi.fn<(name: string) => void>();
const mockCookieSet = vi.fn();
const mockGetCookie = vi.fn<(name: string) => { value: string } | undefined>();

vi.mock<typeof import("next/server")>(import("next/server"), () => {
  class FakeNextResponse {
    status: number;
    headers: Headers;
    bodyText: string | null;
    cookies = { set: mockCookieSet, delete: mockCookieDelete };

    constructor(bodyText: string | null, init?: ResponseInit) {
      this.status = init?.status ?? 200;
      this.headers = new Headers(init?.headers);
      this.bodyText = bodyText;
    }

    static redirect(url: URL | string, init?: { status?: number }) {
      const res = new FakeNextResponse(null, { status: init?.status ?? 302 });
      res.headers.set("location", url.toString());
      return res;
    }

    static json(data: unknown, init?: ResponseInit) {
      const res = new FakeNextResponse(JSON.stringify(data), {
        status: init?.status ?? 200,
        headers: { "content-type": "application/json" },
      });
      return res;
    }
  }

  return { NextResponse: FakeNextResponse };
});

vi.mock<typeof import("next/headers")>(import("next/headers"), () => ({
  cookies: () => Promise.resolve({ get: mockGetCookie }),
}));

const mockLogout = vi.fn<AuthClient["logout"]>();

vi.mock<typeof import("@connectrpc/connect")>(import("@connectrpc/connect"), () => ({
  createClient: (_service: unknown, _transport: unknown) => ({
    logout: mockLogout,
  }),
}));

vi.mock<typeof import("@/shared/api/server/transport")>(
  import("@/shared/api/server/transport"),
  () => ({
    createServerTransport: vi.fn<() => Transport>(() => ({}) as Transport),
  }),
);

function makeRequest(url: string, init?: RequestInit) {
  return new Request(url, init);
}

describe("/api/auth/logout Route Handler", () => {
  const ORIGIN = "http://localhost:3000";

  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("FITAI_RPC_URL", "http://backend:8080");
    mockLogout.mockReset();
    mockGetCookie.mockReset();
    mockCookieDelete.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("calls gRPC AuthService.Logout when refresh_token is present in cookies and deletes all auth cookies", async () => {
    mockGetCookie.mockImplementation((name: string) => {
      if (name === "fitai_refresh_token") {
        return { value: "valid_refresh_token_123" };
      }
      return;
    });

    mockLogout.mockResolvedValue(
      create(LogoutResponseSchema, { success: true, message: "Revoked" }),
    );

    const { POST } = await import("@/app/api/auth/logout/route");
    const res = await POST(
      makeRequest(`${ORIGIN}/api/auth/logout`, {
        method: "POST",
        headers: { accept: "application/json" },
      }),
    );

    expect(mockLogout).toHaveBeenCalledWith({ refreshToken: "valid_refresh_token_123" });
    expect(mockCookieDelete).toHaveBeenCalledWith("fitai_access_token");
    expect(mockCookieDelete).toHaveBeenCalledWith("fitai_refresh_token");
    expect(mockCookieDelete).toHaveBeenCalledWith("fitai_user_id");
    expect(mockCookieDelete).toHaveBeenCalledWith("fitai_oauth_state");
    expect(mockCookieDelete).toHaveBeenCalledWith("fitai_oauth_popup");
    expect(res.status).toBe(200);
  });

  it("redirects to /login when request accepts text/html or is GET request", async () => {
    mockGetCookie.mockReturnValue({ value: "token_abc" });
    mockLogout.mockResolvedValue(create(LogoutResponseSchema, { success: true, message: "OK" }));

    const { GET } = await import("@/app/api/auth/logout/route");
    const res = await GET(
      makeRequest(`${ORIGIN}/api/auth/logout`, {
        method: "GET",
        headers: { accept: "text/html" },
      }),
    );

    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toContain("/login");
    expect(mockCookieDelete).toHaveBeenCalledWith("fitai_access_token");
    expect(mockCookieDelete).toHaveBeenCalledWith("fitai_refresh_token");
  });

  it("safely proceeds and deletes cookies even if gRPC AuthService.Logout throws", async () => {
    mockGetCookie.mockReturnValue({ value: "failing_token" });
    mockLogout.mockRejectedValue(new Error("gRPC server unreachable"));

    const { POST } = await import("@/app/api/auth/logout/route");
    const res = await POST(
      makeRequest(`${ORIGIN}/api/auth/logout`, {
        method: "POST",
      }),
    );

    expect(mockLogout).toHaveBeenCalledWith();
    expect(mockCookieDelete).toHaveBeenCalledWith("fitai_access_token");
    expect(mockCookieDelete).toHaveBeenCalledWith("fitai_refresh_token");
    expect(res.status).toBe(200);
  });

  it("handles logout without refresh_token cookie gracefully", async () => {
    mockGetCookie.mockReturnValue();

    const { POST } = await import("@/app/api/auth/logout/route");
    const res = await POST(
      makeRequest(`${ORIGIN}/api/auth/logout`, {
        method: "POST",
      }),
    );

    expect(mockLogout).not.toHaveBeenCalled();
    expect(mockCookieDelete).toHaveBeenCalledWith("fitai_access_token");
    expect(res.status).toBe(200);
  });
});
