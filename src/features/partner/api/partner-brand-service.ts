"use server";

import { create } from "@bufbuild/protobuf";
import { ConnectError, createClient } from "@connectrpc/connect";
import { z } from "zod";

import { RegisterBrandRequestSchema } from "@/shared/api/gen/contracts/generic/auth/v1/message/auth_messages_pb";
import { AuthService } from "@/shared/api/gen/contracts/generic/auth/v1/service/auth_service_pb";
import { createServerTransport } from "@/shared/api/server/transport";
import { getAuthenticatedSession } from "@/shared/auth/session";

const registerBrandInputSchema = z.object({
  brandName: z.string().trim().min(2, "Tên thương hiệu cần ít nhất 2 ký tự").max(120),
  description: z.string().trim().min(10, "Mô tả cần ít nhất 10 ký tự").max(1000),
  contactPhone: z
    .string()
    .trim()
    .min(8, "Số điện thoại liên hệ không hợp lệ")
    .max(20, "Số điện thoại tối đa 20 ký tự"),
  address: z.string().trim().min(5, "Địa chỉ cần ít nhất 5 ký tự").max(255),
});

export type RegisterBrandInput = z.infer<typeof registerBrandInputSchema>;

export type RegisterBrandResult = { ok: true; message: string } | { ok: false; error: string };

export async function registerBrandAction(
  rawInput: RegisterBrandInput,
): Promise<RegisterBrandResult> {
  const parsed = registerBrandInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message ?? "Dữ liệu đăng ký không hợp lệ";
    return { ok: false, error: firstIssue };
  }

  if (!process.env.FITAI_RPC_URL) {
    return { ok: false, error: "Hệ thống chưa cấu hình kết nối máy chủ (FITAI_RPC_URL)." };
  }

  const { accessToken } = await getAuthenticatedSession();
  if (!accessToken) {
    return { ok: false, error: "Vui lòng đăng nhập trước khi gửi hồ sơ Brand Partner." };
  }

  try {
    const client = createClient(AuthService, createServerTransport(accessToken));
    const request = create(RegisterBrandRequestSchema, {
      brandName: parsed.data.brandName,
      description: parsed.data.description,
      contactPhone: parsed.data.contactPhone,
      address: parsed.data.address,
    });

    const response = await client.registerBrand(request);
    if (!response.success) {
      return {
        ok: false,
        error: response.message || "Không thể gửi yêu cầu đăng ký Brand Partner.",
      };
    }

    return {
      ok: true,
      message:
        response.message ||
        "Đã gửi hồ sơ Brand Partner thành công. Quản trị viên sẽ xét duyệt trong thời gian sớm nhất.",
    };
  } catch (error) {
    const connectError = ConnectError.from(error);
    console.warn("[registerBrandAction] RPC failed:", connectError.message);
    return {
      ok: false,
      error: connectError.rawMessage || "Có lỗi xảy ra khi gửi hồ sơ. Vui lòng thử lại.",
    };
  }
}
