import { create } from "@bufbuild/protobuf";
import type { Client, Transport } from "@connectrpc/connect";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ApproveBrandResponseSchema,
  BrandRequestStatus,
  ListBrandRequestsResponseSchema,
  RejectBrandResponseSchema,
} from "@/shared/api/gen/contracts/generic/auth/v1/message/auth_messages_pb";
import type { AuthService } from "@/shared/api/gen/contracts/generic/auth/v1/service/auth_service_pb";

type AuthClient = Client<typeof AuthService>;

const mockListBrandRequests = vi.fn<AuthClient["listBrandRequests"]>();
const mockApproveBrand = vi.fn<AuthClient["approveBrand"]>();
const mockRejectBrand = vi.fn<AuthClient["rejectBrand"]>();

vi.mock("@connectrpc/connect", () => ({
  createClient: (_service: unknown, _transport: unknown) => ({
    listBrandRequests: mockListBrandRequests,
    approveBrand: mockApproveBrand,
    rejectBrand: mockRejectBrand,
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

describe("admin Brand Service (ConnectRPC List/Approve/Reject)", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("FITAI_RPC_URL", "http://backend:8080");
    mockListBrandRequests.mockReset();
    mockApproveBrand.mockReset();
    mockRejectBrand.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("should return mapped brand onboarding requests", async () => {
    mockListBrandRequests.mockResolvedValue(
      create(ListBrandRequestsResponseSchema, {
        items: [
          {
            id: "req-1",
            userId: "usr-1",
            brandName: "Nike VN",
            description: "Official store",
            contactPhone: "0901234567",
            address: "District 1, HCMC",
            status: BrandRequestStatus.PENDING,
          },
        ],
        total: 1,
        page: 1,
      }),
    );

    const { fetchBrandRequests } = await import("@/features/admin/api/admin-brand-service");
    const res = await fetchBrandRequests({ status: "pending" });

    expect(mockListBrandRequests).toHaveBeenCalledWith({
      page: 1,
      pageSize: 10,
      status: BrandRequestStatus.PENDING,
    });
    expect(res.items).toHaveLength(1);
    expect(res.items[0].brandName).toBe("Nike VN");
    expect(res.items[0].status).toBe("pending");
  });

  it("should call approveBrand RPC with requestId", async () => {
    mockApproveBrand.mockResolvedValue(
      create(ApproveBrandResponseSchema, {
        success: true,
      }),
    );

    const { approveBrandRequest } = await import("@/features/admin/api/admin-brand-service");
    const success = await approveBrandRequest("req-1");

    expect(mockApproveBrand).toHaveBeenCalledWith({
      requestId: "req-1",
    });
    expect(success).toBe(true);
  });

  it("should call rejectBrand RPC with requestId and reason", async () => {
    mockRejectBrand.mockResolvedValue(
      create(RejectBrandResponseSchema, {
        success: true,
      }),
    );

    const { rejectBrandRequest } = await import("@/features/admin/api/admin-brand-service");
    const success = await rejectBrandRequest("req-2", "Missing documents");

    expect(mockRejectBrand).toHaveBeenCalledWith({
      requestId: "req-2",
      reason: "Missing documents",
    });
    expect(success).toBe(true);
  });
});
