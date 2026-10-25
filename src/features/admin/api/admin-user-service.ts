"use server";

import { createClient } from "@connectrpc/connect";

import type {
  AdminUser,
  AdminUserRole,
  AdminUserStatus,
  PaginatedResponse,
  UserAdminFilters,
} from "@/features/admin/domain/admin-types";
import { AuthService } from "@/shared/api/gen/contracts/generic/auth/v1/service/auth_service_pb";
import { createServerTransport } from "@/shared/api/server/transport";
import { getAuthenticatedSession } from "@/shared/auth/session";

export interface FetchUsersParams {
  cursor?: string | null;
  limit?: number;
  filters?: Partial<UserAdminFilters>;
}

export async function fetchAdminUsers({
  cursor = null,
  limit = 10,
  filters,
}: FetchUsersParams): Promise<PaginatedResponse<AdminUser>> {
  if (!process.env.FITAI_RPC_URL) {
    return {
      items: [],
      nextCursor: null,
      totalCount: 0,
    };
  }

  try {
    const { accessToken } = await getAuthenticatedSession();
    const client = createClient(AuthService, createServerTransport(accessToken));

    const page = cursor ? Math.max(1, parseInt(cursor, 10)) : 1;
    const res = await client.listUsers({
      page,
      pageSize: limit,
      search: filters?.q || "",
      role: filters?.role && filters.role !== "all" ? filters.role : "",
      status:
        filters?.status && filters.status !== "all"
          ? filters.status === "banned"
            ? "locked"
            : filters.status
          : "",
    });

    const items: AdminUser[] = (res.items || []).map((u) => {
      const isLocked = u.status === "locked";
      const rawRole = (u.role || "").toLowerCase();
      const role: AdminUserRole =
        rawRole === "admin" ? "admin" : rawRole === "coach" ? "coach" : "user";
      const email = u.identifier || "";
      const displayName =
        u.fullName || (email.includes("@") ? email.split("@")[0] : email) || "User";

      return {
        userId: u.id,
        email,
        displayName,
        role,
        status: isLocked ? "banned" : "active",
        provider: (u.identityType as "google" | "facebook" | "email") || "email",
        createdAt: u.createdAt || new Date().toISOString(),
        updatedAt: u.updatedAt || new Date().toISOString(),
        lastActiveAt: u.updatedAt || u.createdAt || new Date().toISOString(),
      };
    });

    const totalCount = res.total || items.length;
    const hasMore = page * limit < totalCount;
    const nextCursor = hasMore ? String(page + 1) : null;

    return {
      items,
      nextCursor,
      totalCount,
    };
  } catch (error) {
    console.warn("[fetchAdminUsers] RPC failed:", error);
    return {
      items: [],
      nextCursor: null,
      totalCount: 0,
    };
  }
}

export async function toggleUserStatus(
  userId: string,
  currentStatus?: AdminUserStatus,
): Promise<AdminUser> {
  if (!process.env.FITAI_RPC_URL) {
    throw new Error("[toggleUserStatus] FITAI_RPC_URL not configured or RPC failed.");
  }

  const { accessToken } = await getAuthenticatedSession();
  const client = createClient(AuthService, createServerTransport(accessToken));

  const shouldLock = currentStatus !== "banned";
  if (shouldLock) {
    await client.lockUser({
      userId,
      reason: "Account locked by administrator",
    });
  } else {
    await client.unlockUser({
      userId,
    });
  }

  return {
    userId,
    email: "",
    displayName: "",
    role: "user",
    status: shouldLock ? "banned" : "active",
    provider: "email",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
  };
}

export async function resetUserStore(): Promise<void> {
  // Deprecated: In-memory store removed in favor of direct ConnectRPC.
}
