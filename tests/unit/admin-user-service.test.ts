import { create } from "@bufbuild/protobuf";
import type { Client, Transport } from "@connectrpc/connect";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ListUsersResponseSchema,
  LockUserResponseSchema,
  UnlockUserResponseSchema,
} from "@/shared/api/gen/contracts/generic/auth/v1/message/auth_messages_pb";
import type { AuthService } from "@/shared/api/gen/contracts/generic/auth/v1/service/auth_service_pb";

type AuthClient = Client<typeof AuthService>;

const mockListUsers = vi.fn<AuthClient["listUsers"]>();
const mockLockUser = vi.fn<AuthClient["lockUser"]>();
const mockUnlockUser = vi.fn<AuthClient["unlockUser"]>();

vi.mock("@connectrpc/connect", () => ({
  createClient: (_service: unknown, _transport: unknown) => ({
    listUsers: mockListUsers,
    lockUser: mockLockUser,
    unlockUser: mockUnlockUser,
  }),
}));

vi.mock("@/shared/api/server/transport", () => ({
  createServerTransport: vi.fn<() => Transport>(() => ({}) as Transport),
}));

vi.mock("@/shared/auth/session", () => ({
  getAuthenticatedSession: vi.fn(async () => ({ accessToken: "test-admin-token", userId: "usr-admin" })),
}));

describe("admin User Service (ConnectRPC Aligned)", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("FITAI_RPC_URL", "http://backend:8080");
    mockListUsers.mockReset();
    mockLockUser.mockReset();
    mockUnlockUser.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("should return paginated users using ConnectRPC AuthService.listUsers", async () => {
    mockListUsers.mockResolvedValue(
      create(ListUsersResponseSchema, {
        items: [
          {
            id: "usr-1",
            fullName: "Alex Coach",
            identifier: "alex@fitai.com",
            role: "coach",
            status: "active",
            identityType: "email",
          },
          {
            id: "usr-2",
            fullName: "Minh Member",
            identifier: "minh@gmail.com",
            role: "user",
            status: "locked",
            identityType: "google",
          },
        ],
        total: 15,
        page: 1,
        pageSize: 2,
      }),
    );

    const { fetchAdminUsers } = await import("@/features/admin/api/admin-user-service");
    const res = await fetchAdminUsers({ limit: 2 });

    expect(mockListUsers).toHaveBeenCalledWith({
      page: 1,
      pageSize: 2,
      search: "",
      role: "",
      status: "",
    });
    expect(res.items).toHaveLength(2);
    expect(res.items[0].displayName).toBe("Alex Coach");
    expect(res.items[0].status).toBe("active");
    expect(res.items[1].status).toBe("banned");
    expect(res.totalCount).toBe(15);
    expect(res.nextCursor).toBe("2");
  });

  it("should pass search query and filters to RPC", async () => {
    mockListUsers.mockResolvedValue(
      create(ListUsersResponseSchema, {
        items: [],
        total: 0,
        page: 1,
        pageSize: 10,
      }),
    );

    const { fetchAdminUsers } = await import("@/features/admin/api/admin-user-service");
    await fetchAdminUsers({
      filters: { q: "alex", role: "coach", status: "banned" },
    });

    expect(mockListUsers).toHaveBeenCalledWith({
      page: 1,
      pageSize: 10,
      search: "alex",
      role: "coach",
      status: "locked",
    });
  });

  it("should call lockUser when current status is active", async () => {
    mockLockUser.mockResolvedValue(
      create(LockUserResponseSchema, {
        success: true,
        message: "User locked",
      }),
    );

    const { toggleUserStatus } = await import("@/features/admin/api/admin-user-service");
    const updated = await toggleUserStatus("usr-1", "active");

    expect(mockLockUser).toHaveBeenCalledWith({
      userId: "usr-1",
      reason: "Account locked by administrator",
    });
    expect(updated.status).toBe("banned");
  });

  it("should call unlockUser when current status is banned", async () => {
    mockUnlockUser.mockResolvedValue(
      create(UnlockUserResponseSchema, {
        success: true,
        message: "User unlocked",
      }),
    );

    const { toggleUserStatus } = await import("@/features/admin/api/admin-user-service");
    const updated = await toggleUserStatus("usr-2", "banned");

    expect(mockUnlockUser).toHaveBeenCalledWith({
      userId: "usr-2",
    });
    expect(updated.status).toBe("active");
  });
});
