"use server";

import { createClient } from "@connectrpc/connect";

import {
  BrandRequestStatus,
  type BrandRequest,
} from "@/shared/api/gen/contracts/generic/auth/v1/message/auth_messages_pb";
import { AuthService } from "@/shared/api/gen/contracts/generic/auth/v1/service/auth_service_pb";
import { createServerTransport } from "@/shared/api/server/transport";
import { getAuthenticatedSession } from "@/shared/auth/session";

export type AdminBrandRequestStatus = "all" | "pending" | "approved" | "rejected";

export interface AdminBrandRequestItem {
  id: string;
  userId: string;
  brandName: string;
  description: string;
  contactPhone: string;
  address: string;
  status: "pending" | "approved" | "rejected";
  rejectionReason: string;
  reviewedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface FetchBrandRequestsParams {
  page?: number;
  pageSize?: number;
  status?: AdminBrandRequestStatus;
}

export interface BrandRequestsResponse {
  items: AdminBrandRequestItem[];
  total: number;
  page: number;
  pageSize: number;
}

function mapStatusToProto(status?: AdminBrandRequestStatus): BrandRequestStatus {
  switch (status) {
    case "pending":
      return BrandRequestStatus.PENDING;
    case "approved":
      return BrandRequestStatus.APPROVED;
    case "rejected":
      return BrandRequestStatus.REJECTED;
    default:
      return BrandRequestStatus.UNSPECIFIED;
  }
}

function mapProtoToStatus(status: BrandRequestStatus): "pending" | "approved" | "rejected" {
  switch (status) {
    case BrandRequestStatus.APPROVED:
      return "approved";
    case BrandRequestStatus.REJECTED:
      return "rejected";
    default:
      return "pending";
  }
}

function mapProtoToBrandItem(item: BrandRequest): AdminBrandRequestItem {
  return {
    id: item.id,
    userId: item.userId,
    brandName: item.brandName || "Chưa đặt tên",
    description: item.description || "",
    contactPhone: item.contactPhone || "",
    address: item.address || "",
    status: mapProtoToStatus(item.status),
    rejectionReason: item.rejectionReason || "",
    reviewedBy: item.reviewedBy || "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function fetchBrandRequests({
  page = 1,
  pageSize = 10,
  status = "all",
}: FetchBrandRequestsParams): Promise<BrandRequestsResponse> {
  if (!process.env.FITAI_RPC_URL) {
    return { items: [], total: 0, page, pageSize };
  }

  try {
    const { accessToken } = await getAuthenticatedSession();
    const client = createClient(AuthService, createServerTransport(accessToken));

    const res = await client.listBrandRequests({
      page,
      pageSize,
      status: mapStatusToProto(status),
    });

    const items = (res.items || []).map(mapProtoToBrandItem);
    return {
      items,
      total: res.total || items.length,
      page: res.page || page,
      pageSize,
    };
  } catch (error) {
    console.warn("[fetchBrandRequests] RPC failed:", error);
    return { items: [], total: 0, page, pageSize };
  }
}

export async function approveBrandRequest(requestId: string): Promise<boolean> {
  if (!process.env.FITAI_RPC_URL) {
    throw new Error("[approveBrandRequest] FITAI_RPC_URL not configured");
  }

  const { accessToken } = await getAuthenticatedSession();
  const client = createClient(AuthService, createServerTransport(accessToken));

  const res = await client.approveBrand({ requestId });
  return res.success;
}

export async function rejectBrandRequest(requestId: string, reason: string): Promise<boolean> {
  if (!process.env.FITAI_RPC_URL) {
    throw new Error("[rejectBrandRequest] FITAI_RPC_URL not configured");
  }

  const { accessToken } = await getAuthenticatedSession();
  const client = createClient(AuthService, createServerTransport(accessToken));

  const res = await client.rejectBrand({
    requestId,
    reason: reason || "Yêu cầu không đáp ứng tiêu chuẩn đối tác FITAI",
  });
  return res.success;
}
