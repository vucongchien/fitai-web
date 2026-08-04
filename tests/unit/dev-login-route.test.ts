import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockCookieSet = vi.fn();

vi.mock("next/server", () => {
  class FakeNextResponse {
    status: number;
    headers: Headers;
    cookies = { set: mockCookieSet };

    constructor(body: string | null, init?: ResponseInit) {
      this.status = init?.status ?? 200;
      this.headers = new Headers(init?.headers);
    }

    static redirect(url: URL | string) {
      const res = new FakeNextResponse(null, { status: 302 });
      res.headers.set("location", url.toString());
      return res;
    }
  }

  return { NextResponse: FakeNextResponse };
});

vi.mock("@/shared/auth/cookies", () => ({
  createAuthCookieOptions: ({ maxAge }: { maxAge: number }) => ({
    httpOnly: true,
    maxAge,
    path: "/",
    sameSite: "lax",
    secure: false,
  }),
}));

describe("/api/auth/dev-login (Dev Route)", () => {
  const ORIGIN = "http://localhost:3000";

  beforeEach(() => {
    vi.resetModules();
    mockCookieSet.mockReset();
    vi.stubEnv("NODE_ENV", "development");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns 404 when NODE_ENV is production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { GET } = await import("@/app/api/auth/dev-login/route");
    const req = new Request(`${ORIGIN}/api/auth/dev-login`);
    const res = await GET(req);

    expect(res.status).toBe(404);
  });

  it("redirects to /onboarding for new user target and sets cookies", async () => {
    const { GET } = await import("@/app/api/auth/dev-login/route");
    const req = new Request(`${ORIGIN}/api/auth/dev-login?target=new`);
    const res = await GET(req);

    expect(res.headers.get("location")).toContain("/onboarding");
    const cookieNames = mockCookieSet.mock.calls.map((c) => c[0]);
    expect(cookieNames).toContain("fitai_access_token");
    expect(cookieNames).toContain("fitai_refresh_token");
    expect(cookieNames).toContain("fitai_user_id");
  });

  it("redirects to /planning for existing user target and sets cookies", async () => {
    const { GET } = await import("@/app/api/auth/dev-login/route");
    const req = new Request(`${ORIGIN}/api/auth/dev-login?target=existing`);
    const res = await GET(req);

    expect(res.headers.get("location")).toContain("/planning");
    const cookieNames = mockCookieSet.mock.calls.map((c) => c[0]);
    expect(cookieNames).toContain("fitai_access_token");
    expect(cookieNames).toContain("fitai_refresh_token");
    expect(cookieNames).toContain("fitai_user_id");
  });
});
