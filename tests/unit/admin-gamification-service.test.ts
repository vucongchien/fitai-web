import { create } from "@bufbuild/protobuf";
import type { Client, Transport } from "@connectrpc/connect";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  AdminAdjustCoinsResponseSchema,
  GetWalletResponseSchema,
  ListTransactionsResponseSchema,
} from "@/shared/api/gen/contracts/supporting/gamification/v1/message/gamification_messages_pb";
import type { GamificationService } from "@/shared/api/gen/contracts/supporting/gamification/v1/service/gamification_service_pb";

type GamificationClient = Client<typeof GamificationService>;

const mockGetWallet = vi.fn<GamificationClient["getWallet"]>();
const mockListTransactions = vi.fn<GamificationClient["listTransactions"]>();
const mockAdminAdjustCoins = vi.fn<GamificationClient["adminAdjustCoins"]>();

vi.mock("@connectrpc/connect", () => ({
  createClient: (_service: unknown, _transport: unknown) => ({
    getWallet: mockGetWallet,
    listTransactions: mockListTransactions,
    adminAdjustCoins: mockAdminAdjustCoins,
  }),
}));

vi.mock("@/shared/api/server/transport", () => ({
  createServerTransport: vi.fn<() => Transport>(() => ({}) as Transport),
}));

vi.mock("@/shared/auth/session", () => ({
  getAuthenticatedSession: vi.fn(async () => ({
    accessToken: "test-admin-token",
    userId: "usr-admin",
  })),
}));

describe("admin Gamification Service (ConnectRPC Aligned)", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("FITAI_RPC_URL", "http://backend:8080");
    mockGetWallet.mockReset();
    mockListTransactions.mockReset();
    mockAdminAdjustCoins.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("should fetch user wallet via ConnectRPC getWallet", async () => {
    mockGetWallet.mockResolvedValue(
      create(GetWalletResponseSchema, {
        userId: "user-target-1",
        balance: 150n,
      }),
    );

    const { fetchUserWallet } = await import("@/features/admin/api/admin-gamification-service");
    const res = await fetchUserWallet("user-target-1");

    expect(mockGetWallet).toHaveBeenCalledWith({ userId: "user-target-1" });
    expect(res.userId).toBe("user-target-1");
    expect(res.balance).toBe(150);
  });

  it("should fetch user transactions via ConnectRPC listTransactions", async () => {
    mockListTransactions.mockResolvedValue(
      create(ListTransactionsResponseSchema, {
        entries: [
          {
            id: "tx-1",
            userId: "user-target-1",
            amount: 50n,
            balanceAfter: 150n,
            reason: "ADMIN_ADJUST",
            idempotencyKey: "idemp-key-1",
            activityDate: "2026-10-25",
          },
        ],
        nextCursor: "cursor-token-2",
      }),
    );

    const { fetchUserTransactions } =
      await import("@/features/admin/api/admin-gamification-service");
    const res = await fetchUserTransactions("user-target-1", 10);

    expect(mockListTransactions).toHaveBeenCalledWith({
      userId: "user-target-1",
      limit: 10,
      cursor: "",
    });
    expect(res.entries).toHaveLength(1);
    expect(res.entries[0].amount).toBe(50);
    expect(res.entries[0].balanceAfter).toBe(150);
    expect(res.nextCursor).toBe("cursor-token-2");
  });

  it("should adjust user coins via ConnectRPC adminAdjustCoins", async () => {
    mockAdminAdjustCoins.mockResolvedValue(
      create(AdminAdjustCoinsResponseSchema, {
        balanceAfter: 200n,
        transactionId: "tx-generated-uuid",
      }),
    );

    const { adminAdjustUserCoins } =
      await import("@/features/admin/api/admin-gamification-service");
    const res = await adminAdjustUserCoins({
      targetUserId: "user-target-1",
      amount: 50,
      reason: "COMPENSATION",
      note: "Refund workout disconnect",
    });

    expect(mockAdminAdjustCoins).toHaveBeenCalledWith(
      expect.objectContaining({
        targetUserId: "user-target-1",
        amount: 50n,
        reason: "COMPENSATION",
        note: "Refund workout disconnect",
      }),
    );
    expect(res.balanceAfter).toBe(200);
    expect(res.transactionId).toBe("tx-generated-uuid");
  });
});
