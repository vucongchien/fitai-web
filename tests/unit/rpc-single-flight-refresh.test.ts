import { beforeEach, vi, afterEach, describe, expect, it } from 'vitest';
import { create } from "@bufbuild/protobuf";
import type { Client, Transport } from "@connectrpc/connect";


import { RefreshTokenResponseSchema } from "@/shared/api/gen/contracts/generic/auth/v1/message/auth_messages_pb";
import type { AuthService } from "@/shared/api/gen/contracts/generic/auth/v1/service/auth_service_pb";

type AuthClient = Client<typeof AuthService>;

const mockCookieSet = vi.fn();
const mockCookieDelete = vi.fn();
const mockGetCookie = vi.fn<(name: string) => { value: string } | undefined>();

vi.mock<typeof import("next/headers")>(import("next/headers"), () => ({
  cookies: () =>
    Promise.resolve({
      get: mockGetCookie,
      set: mockCookieSet,
      delete: mockCookieDelete,
    }),
}));

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

function makeRpcRequest(path: string, token?: string) {
  const headers = new Headers({
    "content-type": "application/grpc-web+proto",
    "x-grpc-web": "1",
  });
  if (token) {
    headers.set("authorization", `Bearer ${token}`);
  }
  return new Request(`http://localhost:3000/rpc/${path}`, {
    method: "POST",
    headers,
    body: new Uint8Array([0, 0, 0, 0, 0]),
  });
}

describe("bFF /rpc/[...path] Single-flight Token Refresh", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("FITAI_RPC_URL", "http://backend:8080");
    mockRefreshToken.mockReset();
    mockCookieSet.mockReset();
    mockCookieDelete.mockReset();
    mockGetCookie.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("transparently refreshes expired token on 401 and retries original request", async () => {
    mockGetCookie.mockImplementation((name: string) => {
      if (name === "fitai_access_token") {
        return { value: "expired_access_token" };
      }
      if (name === "fitai_refresh_token") {
        return { value: "valid_refresh_token" };
      }
      return;
    });

    let fetchCount = 0;
    const fetchMock = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
      fetchCount++;
      const headers = new Headers(init?.headers);
      const auth = headers.get("authorization");
      if (auth === "Bearer expired_access_token") {
        return new Response(new Uint8Array([]), {
          status: 401,
          statusText: "Unauthorized",
        });
      }
      return new Response(new Uint8Array([1, 2, 3]), {
        status: 200,
        statusText: "OK",
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    mockRefreshToken.mockResolvedValue(
      create(RefreshTokenResponseSchema, {
        accessToken: "fresh_new_access_token",
        refreshToken: "fresh_new_refresh_token",
      }),
    );

    const { POST } = await import("@/app/rpc/[...path]/route");
    const res = await POST(
      makeRpcRequest("contracts.supporting.profile.v1.service.ProfileService/GetProfile"),
      {
        params: Promise.resolve({
          path: ["contracts.supporting.profile.v1.service.ProfileService", "GetProfile"],
        }),
      },
    );

    expect(mockRefreshToken).toHaveBeenCalledTimes(1);
    expect(mockRefreshToken).toHaveBeenCalledWith({ refreshToken: "valid_refresh_token" });
    expect(mockCookieSet).toHaveBeenCalledWith(
      "fitai_access_token",
      "fresh_new_access_token",
      expect.objectContaining({ httpOnly: true }),
    );
    expect(mockCookieSet).toHaveBeenCalledWith(
      "fitai_refresh_token",
      "fresh_new_refresh_token",
      expect.objectContaining({ httpOnly: true }),
    );
    expect(res.status).toBe(200);
  });

  it("executes single-flight token refresh when multiple requests encounter 401 concurrently", async () => {
    mockGetCookie.mockImplementation((name: string) => {
      if (name === "fitai_access_token") {
        return { value: "shared_expired_token" };
      }
      if (name === "fitai_refresh_token") {
        return { value: "shared_refresh_token" };
      }
      return;
    });

    const fetchMock = vi.fn().mockImplementation(async (_url: string, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      const auth = headers.get("authorization");
      if (auth === "Bearer shared_expired_token") {
        return new Response(new Uint8Array([]), {
          status: 401,
          statusText: "Unauthorized",
        });
      }
      return new Response(new Uint8Array([10, 20]), {
        status: 200,
        statusText: "OK",
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    // Simulate async network delay in token refresh
    mockRefreshToken.mockImplementation(async () => {
      await new Promise((r) => setTimeout(r, 20));
      return create(RefreshTokenResponseSchema, {
        accessToken: "deduped_access_token",
        refreshToken: "deduped_refresh_token",
      });
    });

    const { POST } = await import("@/app/rpc/[...path]/route");

    const req1 = POST(
      makeRpcRequest("contracts.supporting.profile.v1.service.ProfileService/GetProfile"),
      {
        params: Promise.resolve({
          path: ["contracts.supporting.profile.v1.service.ProfileService", "GetProfile"],
        }),
      },
    );
    const req2 = POST(
      makeRpcRequest("contracts.core.coaching.v1.service.CoachingService/GetCoachAdvice"),
      {
        params: Promise.resolve({
          path: ["contracts.core.coaching.v1.service.CoachingService", "GetCoachAdvice"],
        }),
      },
    );
    const req3 = POST(
      makeRpcRequest("contracts.supporting.exercise.v1.service.ExerciseService/ListExercises"),
      {
        params: Promise.resolve({
          path: ["contracts.supporting.exercise.v1.service.ExerciseService", "ListExercises"],
        }),
      },
    );

    const [res1, res2, res3] = await Promise.all([req1, req2, req3]);

    expect(mockRefreshToken).toHaveBeenCalledTimes(1);
    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
    expect(res3.status).toBe(200);
  });

  it("clears cookies when token refresh throws an error", async () => {
    mockGetCookie.mockImplementation((name: string) => {
      if (name === "fitai_access_token") {
        return { value: "invalid_token" };
      }
      if (name === "fitai_refresh_token") {
        return { value: "revoked_refresh_token" };
      }
      return;
    });

    const fetchMock = vi.fn().mockImplementation(async () => 
      new Response(new Uint8Array([]), {
        status: 401,
        statusText: "Unauthorized",
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    mockRefreshToken.mockRejectedValue(new Error("Refresh token revoked"));

    const { POST } = await import("@/app/rpc/[...path]/route");
    const res = await POST(
      makeRpcRequest("contracts.supporting.profile.v1.service.ProfileService/GetProfile"),
      {
        params: Promise.resolve({
          path: ["contracts.supporting.profile.v1.service.ProfileService", "GetProfile"],
        }),
      },
    );

    expect(mockCookieDelete).toHaveBeenCalledWith("fitai_access_token");
    expect(mockCookieDelete).toHaveBeenCalledWith("fitai_refresh_token");
    expect(mockCookieDelete).toHaveBeenCalledWith("fitai_user_id");
    expect(res.status).toBe(401);
  });
});
