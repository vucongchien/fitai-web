"use server";

import { create } from "@bufbuild/protobuf";
import { ConnectError, createClient } from "@connectrpc/connect";
import { z } from "zod";

import { RegisterBrandRequestSchema } from "@/shared/api/gen/contracts/generic/auth/v1/message/auth_messages_pb";
import { AuthService } from "@/shared/api/gen/contracts/generic/auth/v1/service/auth_service_pb";
import { createServerTransport } from "@/shared/api/server/transport";
import { getAuthenticatedSession } from "@/shared/auth/session";

const registerBrandInputSchema = z.object({
  brandName: z.string().trim().min(2, "Brand name must be at least 2 characters").max(120),
  description: z.string().trim().min(10, "Description must be at least 10 characters").max(1000),
  contactPhone: z
    .string()
    .trim()
    .min(8, "Contact phone number is invalid")
    .max(20, "Contact phone number must be at most 20 characters"),
  address: z.string().trim().min(5, "Address must be at least 5 characters").max(255),
});

export type RegisterBrandInput = z.infer<typeof registerBrandInputSchema>;

export type RegisterBrandResult = { ok: true; message: string } | { ok: false; error: string };

export async function registerBrandAction(
  rawInput: RegisterBrandInput,
): Promise<RegisterBrandResult> {
  const parsed = registerBrandInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message ?? "Invalid brand registration input";
    return { ok: false, error: firstIssue };
  }

  if (!process.env.FITAI_RPC_URL) {
    return { ok: false, error: "Server RPC endpoint is not configured (FITAI_RPC_URL)." };
  }

  const { accessToken } = await getAuthenticatedSession();
  if (!accessToken) {
    return { ok: false, error: "Please sign in before submitting a Brand Partner application." };
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
        error: response.message || "Unable to submit Brand Partner application.",
      };
    }

    return {
      ok: true,
      message:
        response.message ||
        "Brand Partner application submitted successfully. Our admin team will review it shortly.",
    };
  } catch (error) {
    const connectError = ConnectError.from(error);
    console.warn("[registerBrandAction] RPC failed:", connectError.message);
    return {
      ok: false,
      error: connectError.rawMessage || "Failed to submit application. Please try again.",
    };
  }
}
