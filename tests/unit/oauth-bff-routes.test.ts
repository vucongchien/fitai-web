import { create } from "@bufbuild/protobuf";
import type { Client, Transport } from "@connectrpc/connect";


import {
  GetOAuthLoginURLResponseSchema,
  LoginWithOAuthResponseSchema,
} from "@/shared/api/gen/contracts/generic/auth/v1/message/auth_messages_pb";
import type { AuthService } from "@/shared/api/gen/contracts/generic/auth/v1/service/auth_service_pb";
import { GetProfileResponseSchema } from "@/shared/api/gen/contracts/supporting/profile/v1/message/profile_messages_pb";
import type { ProfileService } from "@/shared/api/gen/contracts/supporting/profile/v1/service/profile_service_pb";
import type { createAuthCookieOptions } from "@/shared/auth/cookies";

type AuthClient = Client<typeof AuthService>;
type ProfileClient = Client<typeof ProfileService>;

const mockCookieSet =
  vi.fn<
    (name: string, value: string, options: ReturnType<typeof createAuthCookieOptions>) => void
  >();
const mockCookieDelete = vi.fn<(name: string) => void>();

vi.mock<typeof import('next/server')>(import('next/server'), () => {
  class FakeNextResponse {
    status: number;
    headers: Headers;
    cookies = { set: mockCookieSet, delete: mockCookieDelete };
    constructor(_body: string | null, init?: ResponseInit) {
      this.status = init?.status ?? 200;
      this.headers = new Headers(init?.headers);
    }

    static redirect(url: URL | string, init?: { status?: number }) {
      const res = new FakeNextResponse(null, { status: init?.status ?? 302 });
      res.headers.set("location", url.toString());
      return res;
    }
  }

  return { NextResponse: FakeNextResponse };
});

/** `(await cookies()).get(name)`. The routes only ever read `.value`. */
const mockGetCookie = vi.fn<(name: string) => { value: string } | undefined>();
vi.mock<typeof import('next/headers')>(import('next/headers'), () => ({
  cookies: () => Promise.resolve({ get: mockGetCookie }),
}));

const mockGetOAuthLoginURL = vi.fn<AuthClient["getOAuthLoginURL"]>();
const mockLoginWithOAuth = vi.fn<AuthClient["loginWithOAuth"]>();
const mockGetProfile = vi.fn<ProfileClient["getProfile"]>();

vi.mock<typeof import('@connectrpc/connect')>(import('@connectrpc/connect'), () => ({
  createClient: (_service: unknown, _transport: unknown) => ({
    getOAuthLoginURL: mockGetOAuthLoginURL,
    loginWithOAuth: mockLoginWithOAuth,
    getProfile: mockGetProfile,
  }),
}));

vi.mock<typeof import('@/shared/api/server/transport')>(import('@/shared/api/server/transport'), () => ({
  // `createClient` is mocked too, so the transport is never actually used.
  createServerTransport: vi.fn<() => Transport>(() => ({}) as Transport),
}));

vi.mock<typeof import('@/shared/auth/cookies')>(import('@/shared/auth/cookies'), () => ({
  createAuthCookieOptions: ({ maxAge }: { maxAge: number }) => ({
    httpOnly: true,
    maxAge,
    path: "/",
    sameSite: "lax",
    secure: false,
  }),
}));

function makeRequest(url: string) {
  return new Request(url);
}

describe("/api/auth/oauth/[provider] (BFF entry route)", () => {
  const ORIGIN = "http://localhost:3000";

  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("FITAI_RPC_URL", "http://backend:8080");
    mockGetOAuthLoginURL.mockReset();
    mockCookieSet.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("redirects to invalid_provider if provider is unknown", async () => {
    const { GET } = await import("@/app/api/auth/oauth/[provider]/route");
    const res = await GET(makeRequest(`${ORIGIN}/api/auth/oauth/twitter`), {
      params: Promise.resolve({ provider: "twitter" }),
    });
    expect(res.headers.get("location")).toContain("/login?error=invalid_provider");
  });

  it("redirects to onboarding when FITAI_RPC_URL is not set", async () => {
    vi.stubEnv("FITAI_RPC_URL", "");
    const { GET } = await import("@/app/api/auth/oauth/[provider]/route");
    const res = await GET(makeRequest(`${ORIGIN}/api/auth/oauth/google`), {
      params: Promise.resolve({ provider: "google" }),
    });
    expect(res.headers.get("location")).toContain("/onboarding");
  });

  it("307 redirects to OAuth URL and sets state cookie", async () => {
    const fakeLoginUrl = "https://accounts.google.com/o/oauth2/auth?state=abc123";
    mockGetOAuthLoginURL.mockResolvedValue(
      create(GetOAuthLoginURLResponseSchema, { loginUrl: fakeLoginUrl }),
    );

    const { GET } = await import("@/app/api/auth/oauth/[provider]/route");
    const res = await GET(makeRequest(`${ORIGIN}/api/auth/oauth/google`), {
      params: Promise.resolve({ provider: "google" }),
    });

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(fakeLoginUrl);
    expect(mockCookieSet).toHaveBeenCalledWith(
      "fitai_oauth_state",
      "abc123",
      expect.objectContaining({ httpOnly: true }),
    );
  });

  it("redirects to callback_failed if gRPC throws", async () => {
    mockGetOAuthLoginURL.mockRejectedValue(new Error("network error"));

    const { GET } = await import("@/app/api/auth/oauth/[provider]/route");
    const res = await GET(makeRequest(`${ORIGIN}/api/auth/oauth/facebook`), {
      params: Promise.resolve({ provider: "facebook" }),
    });
    expect(res.headers.get("location")).toContain("/login?error=callback_failed");
  });

  it("accepts facebook as a valid provider", async () => {
    const fakeLoginUrl = "https://www.facebook.com/v12.0/dialog/oauth?state=xyz";
    mockGetOAuthLoginURL.mockResolvedValue(
      create(GetOAuthLoginURLResponseSchema, { loginUrl: fakeLoginUrl }),
    );

    const { GET } = await import("@/app/api/auth/oauth/[provider]/route");
    const res = await GET(makeRequest(`${ORIGIN}/api/auth/oauth/facebook`), {
      params: Promise.resolve({ provider: "facebook" }),
    });

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(fakeLoginUrl);
  });

  it("sets fitai_oauth_popup cookie when popup=1", async () => {
    mockGetOAuthLoginURL.mockResolvedValue(
      create(GetOAuthLoginURLResponseSchema, {
        loginUrl: "https://accounts.google.com/o/oauth2/auth?state=abc123",
      }),
    );

    const { GET } = await import("@/app/api/auth/oauth/[provider]/route");
    const res = await GET(makeRequest(`${ORIGIN}/api/auth/oauth/google?popup=1`), {
      params: Promise.resolve({ provider: "google" }),
    });

    expect(res.status).toBe(307);
    const cookieNames = mockCookieSet.mock.calls.map((c) => c[0]);
    expect(cookieNames).toContain("fitai_oauth_popup");
  });
});

describe("/auth/callback/[provider] (callback route)", () => {
  const ORIGIN = "http://localhost:3000";
  const CODE = "auth_code_abc";
  const STATE = "csrf_state_xyz";

  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("FITAI_RPC_URL", "http://backend:8080");
    mockGetCookie.mockReset();
    mockLoginWithOAuth.mockReset();
    mockGetProfile.mockReset();
    mockCookieSet.mockReset();
    mockCookieDelete.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("redirects to missing_code when code is absent", async () => {
    mockGetCookie.mockReturnValue({ value: STATE });
    const { GET } = await import("@/app/auth/callback/[provider]/route");
    const res = await GET(makeRequest(`${ORIGIN}/auth/callback/google?state=${STATE}`), {
      params: Promise.resolve({ provider: "google" }),
    });
    expect(res.headers.get("location")).toContain("/login?error=missing_code");
  });

  it("redirects to invalid_state when state cookie does not match", async () => {
    mockGetCookie.mockReturnValue({ value: "wrong_state" });
    const { GET } = await import("@/app/auth/callback/[provider]/route");
    const res = await GET(
      makeRequest(`${ORIGIN}/auth/callback/google?code=${CODE}&state=${STATE}`),
      {
        params: Promise.resolve({ provider: "google" }),
      },
    );
    expect(res.headers.get("location")).toContain("/login?error=invalid_state");
  });

  it("redirects to invalid_state when state cookie is absent", async () => {
    mockGetCookie.mockReturnValue();
    const { GET } = await import("@/app/auth/callback/[provider]/route");
    const res = await GET(
      makeRequest(`${ORIGIN}/auth/callback/google?code=${CODE}&state=${STATE}`),
      {
        params: Promise.resolve({ provider: "google" }),
      },
    );
    expect(res.headers.get("location")).toContain("/login?error=invalid_state");
  });

  it("redirects to /onboarding when profile completion is low (<80)", async () => {
    mockGetCookie.mockReturnValue({ value: STATE });
    mockLoginWithOAuth.mockResolvedValue(
      create(LoginWithOAuthResponseSchema, {
        accessToken: "t",
        refreshToken: "r",
        userId: "user_1",
      }),
    );
    mockGetProfile.mockResolvedValue(create(GetProfileResponseSchema, { completionRate: 30 }));

    const { GET } = await import("@/app/auth/callback/[provider]/route");
    const res = await GET(
      makeRequest(`${ORIGIN}/auth/callback/google?code=${CODE}&state=${STATE}`),
      {
        params: Promise.resolve({ provider: "google" }),
      },
    );
    expect(res.headers.get("location")).toContain("/onboarding");
  });

  it("redirects to /planning when profile completion ≥80 but no active roadmap", async () => {
    mockGetCookie.mockReturnValue({ value: STATE });
    mockLoginWithOAuth.mockResolvedValue(
      create(LoginWithOAuthResponseSchema, {
        accessToken: "t",
        refreshToken: "r",
        userId: "user_1",
      }),
    );
    mockGetProfile.mockResolvedValue(create(GetProfileResponseSchema, { completionRate: 85 }));

    const { GET } = await import("@/app/auth/callback/[provider]/route");
    const res = await GET(
      makeRequest(`${ORIGIN}/auth/callback/google?code=${CODE}&state=${STATE}`),
      {
        params: Promise.resolve({ provider: "google" }),
      },
    );
    expect(res.headers.get("location")).toContain("/planning");
  });

  it("sets all three auth cookies on success", async () => {
    mockGetCookie.mockReturnValue({ value: STATE });
    mockLoginWithOAuth.mockResolvedValue(
      create(LoginWithOAuthResponseSchema, {
        accessToken: "t",
        refreshToken: "r",
        userId: "user_1",
      }),
    );
    mockGetProfile.mockResolvedValue(create(GetProfileResponseSchema, { completionRate: 30 }));

    const { GET } = await import("@/app/auth/callback/[provider]/route");
    await GET(makeRequest(`${ORIGIN}/auth/callback/google?code=${CODE}&state=${STATE}`), {
      params: Promise.resolve({ provider: "google" }),
    });

    const names = mockCookieSet.mock.calls.map((c) => c[0]);
    expect(names).toContain("fitai_access_token");
    expect(names).toContain("fitai_refresh_token");
    expect(names).toContain("fitai_user_id");
    expect(mockCookieDelete).toHaveBeenCalledWith("fitai_oauth_state");
  });

  it("redirects to callback_failed when loginWithOAuth throws", async () => {
    mockGetCookie.mockReturnValue({ value: STATE });
    mockLoginWithOAuth.mockRejectedValue(new Error("grpc error"));

    const { GET } = await import("@/app/auth/callback/[provider]/route");
    const res = await GET(
      makeRequest(`${ORIGIN}/auth/callback/google?code=${CODE}&state=${STATE}`),
      {
        params: Promise.resolve({ provider: "google" }),
      },
    );
    expect(res.headers.get("location")).toContain("/login?error=callback_failed");
  });

  it("falls back to /onboarding when Profile API throws", async () => {
    mockGetCookie.mockReturnValue({ value: STATE });
    mockLoginWithOAuth.mockResolvedValue(
      create(LoginWithOAuthResponseSchema, {
        accessToken: "t",
        refreshToken: "r",
        userId: "user_1",
      }),
    );
    mockGetProfile.mockRejectedValue(new Error("profile unavailable"));

    const { GET } = await import("@/app/auth/callback/[provider]/route");
    const res = await GET(
      makeRequest(`${ORIGIN}/auth/callback/google?code=${CODE}&state=${STATE}`),
      {
        params: Promise.resolve({ provider: "google" }),
      },
    );
    expect(res.headers.get("location")).toContain("/onboarding");
  });
});
