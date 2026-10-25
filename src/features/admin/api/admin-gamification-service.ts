"use server";

import { createClient } from "@connectrpc/connect";

import { GamificationService } from "@/shared/api/gen/contracts/supporting/gamification/v1/service/gamification_service_pb";
import { createServerTransport } from "@/shared/api/server/transport";
import { getAuthenticatedSession } from "@/shared/auth/session";

export interface UserWalletSummary {
  userId: string;
  balance: number;
  updatedAt: string;
}

export interface UserCoinTransaction {
  id: string;
  userId: string;
  amount: number;
  balanceAfter: number;
  reason: string;
  referenceId?: string;
  idempotencyKey: string;
  activityDate: string;
  adminId?: string;
  note?: string;
  createdAt: string;
}

export interface UserTransactionsResponse {
  entries: UserCoinTransaction[];
  nextCursor?: string;
}

export interface AdjustCoinsParams {
  targetUserId: string;
  amount: number;
  reason: string;
  note?: string;
}

export interface AdjustCoinsResult {
  balanceAfter: number;
  transactionId: string;
}

export async function fetchUserWallet(userId: string): Promise<UserWalletSummary> {
  if (!process.env.FITAI_RPC_URL) {
    return {
      userId,
      balance: 0,
      updatedAt: new Date().toISOString(),
    };
  }

  try {
    const { accessToken } = await getAuthenticatedSession();
    const client = createClient(GamificationService, createServerTransport(accessToken));
    const res = await client.getWallet({ userId });

    return {
      userId: res.userId || userId,
      balance: Number(res.balance || 0n),
      updatedAt: res.updatedAt
        ? new Date(Number(res.updatedAt.seconds) * 1000).toISOString()
        : new Date().toISOString(),
    };
  } catch (error) {
    console.warn(`[fetchUserWallet] RPC failed for ${userId}:`, error);
    return {
      userId,
      balance: 0,
      updatedAt: new Date().toISOString(),
    };
  }
}

export async function fetchUserTransactions(
  userId: string,
  limit: number = 20,
  cursor: string = "",
): Promise<UserTransactionsResponse> {
  if (!process.env.FITAI_RPC_URL) {
    return {
      entries: [],
      nextCursor: undefined,
    };
  }

  try {
    const { accessToken } = await getAuthenticatedSession();
    const client = createClient(GamificationService, createServerTransport(accessToken));
    const res = await client.listTransactions({
      userId,
      limit,
      cursor,
    });

    const entries: UserCoinTransaction[] = (res.entries || []).map((e) => ({
      id: e.id,
      userId: e.userId,
      amount: Number(e.amount || 0n),
      balanceAfter: Number(e.balanceAfter || 0n),
      reason: e.reason,
      referenceId: e.referenceId || undefined,
      idempotencyKey: e.idempotencyKey,
      activityDate: e.activityDate,
      adminId: e.adminId || undefined,
      note: e.note || undefined,
      createdAt: e.createdAt
        ? new Date(Number(e.createdAt.seconds) * 1000).toISOString()
        : new Date().toISOString(),
    }));

    return {
      entries,
      nextCursor: res.nextCursor || undefined,
    };
  } catch (error) {
    console.warn(`[fetchUserTransactions] RPC failed for ${userId}:`, error);
    return {
      entries: [],
      nextCursor: undefined,
    };
  }
}

export async function adminAdjustUserCoins(params: AdjustCoinsParams): Promise<AdjustCoinsResult> {
  if (!process.env.FITAI_RPC_URL) {
    throw new Error("[adminAdjustUserCoins] FITAI_RPC_URL not configured");
  }

  const { accessToken } = await getAuthenticatedSession();
  const client = createClient(GamificationService, createServerTransport(accessToken));

  const idempotencyKey = crypto.randomUUID();
  const res = await client.adminAdjustCoins({
    targetUserId: params.targetUserId,
    amount: BigInt(params.amount),
    reason: params.reason || "ADMIN_ADJUST",
    note: params.note || "",
    idempotencyKey,
  });

  return {
    balanceAfter: Number(res.balanceAfter || 0n),
    transactionId: res.transactionId,
  };
}
