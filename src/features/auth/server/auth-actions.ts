"use server";

import { createClient } from "@connectrpc/connect";
import { cookies } from "next/headers";

import { AuthService } from "@/shared/api/gen/contracts/generic/auth/v1/service/auth_service_pb";
import { ProfileService } from "@/shared/api/gen/contracts/supporting/profile/v1/service/profile_service_pb";
import { createServerTransport } from "@/shared/api/server/transport";
import { createAuthCookieOptions } from "@/shared/auth/cookies";
import { resolveEntryRoute } from "@/shared/auth/route-decision";
import {
  detectIdentifierType,
  normalizePhoneNumber,
} from "@/features/auth/model/auth-validation";
import { Gender } from "@/shared/api/gen/contracts/generic/auth/v1/message/auth_messages_pb";

export type AuthActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

const ACCESS_TOKEN_MAX_AGE = 60 * 15;
const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 30;

function formatIdentifier(raw: string): string {
  const type = detectIdentifierType(raw);
  return type === "phone" ? normalizePhoneNumber(raw) : raw.trim();
}

async function resolvePostLoginRoute(accessToken: string, userId: string): Promise<string> {
  if (!process.env.FITAI_RPC_URL) {
    return "/home";
  }
  try {
    const client = createClient(ProfileService, createServerTransport(accessToken));
    const profile = await client.getProfile({ userId });
    return resolveEntryRoute({
      hasActiveRoadmap: false,
      hasValidSession: true,
      profileCompletionRate: profile.completionRate,
    });
  } catch {
    return "/onboarding";
  }
}

async function persistSessionCookies(accessToken: string, refreshToken: string, userId: string) {
  const cookieStore = await cookies();
  cookieStore.set(
    "fitai_access_token",
    accessToken,
    createAuthCookieOptions({ maxAge: ACCESS_TOKEN_MAX_AGE }),
  );
  cookieStore.set(
    "fitai_refresh_token",
    refreshToken,
    createAuthCookieOptions({ maxAge: REFRESH_TOKEN_MAX_AGE }),
  );
  cookieStore.set(
    "fitai_user_id",
    userId,
    createAuthCookieOptions({ maxAge: REFRESH_TOKEN_MAX_AGE }),
  );
}

export async function sendOtpAction(
  rawIdentifier: string,
  purpose: "login" | "register",
): Promise<AuthActionResult<{ otpToken: string; expiresInSeconds: number }>> {
  const identifier = formatIdentifier(rawIdentifier);
  if (!identifier) {
    return { success: false, error: "Vui lòng nhập số điện thoại hoặc email hợp lệ." };
  }

  if (!process.env.FITAI_RPC_URL) {
    return {
      success: true,
      data: {
        otpToken: `mock_otp_${Date.now()}`,
        expiresInSeconds: 60,
      },
    };
  }

  try {
    const client = createClient(AuthService, createServerTransport());
    const response = await client.sendOTP({ identifier, purpose });
    return {
      success: true,
      data: {
        otpToken: response.otpToken,
        expiresInSeconds: Number(response.expiresInSeconds) || 60,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không thể gửi mã OTP. Vui lòng thử lại.";
    return { success: false, error: message };
  }
}

export async function verifyOtpAction(
  otpToken: string,
  code: string,
): Promise<AuthActionResult<{ valid: boolean; resetToken?: string }>> {
  if (!otpToken || !code || code.length !== 6) {
    return { success: false, error: "Mã OTP phải gồm 6 chữ số." };
  }

  if (!process.env.FITAI_RPC_URL) {
    return { success: true, data: { valid: true } };
  }

  try {
    const client = createClient(AuthService, createServerTransport());
    const response = await client.verifyOTP({ otpToken, code });
    if (!response.valid) {
      return { success: false, error: response.message || "Mã xác thực không hợp lệ hoặc đã hết hạn." };
    }
    return {
      success: true,
      data: {
        valid: true,
        resetToken: response.resetToken,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Xác thực mã OTP thất bại.";
    return { success: false, error: message };
  }
}

export async function loginWithPasswordAction(
  rawIdentifier: string,
  password: string,
): Promise<AuthActionResult<{ redirectUrl: string }>> {
  const identifier = formatIdentifier(rawIdentifier);
  if (!identifier || !password) {
    return { success: false, error: "Please enter your email or phone number and password." };
  }

  if (!process.env.FITAI_RPC_URL) {
    await persistSessionCookies("mock_access_token", "mock_refresh_token", "mock_user_id");
    return { success: true, data: { redirectUrl: "/home" } };
  }

  try {
    const client = createClient(AuthService, createServerTransport());
    const response = await client.login({ identifier, password });
    await persistSessionCookies(response.accessToken, response.refreshToken, response.userId);
    const redirectUrl = await resolvePostLoginRoute(response.accessToken, response.userId);
    return { success: true, data: { redirectUrl } };
  } catch {
    // Security: Mask login errors to generic message to prevent account enumeration
    return { success: false, error: "Invalid email, phone number, or password. Please try again." };
  }
}

export async function registerAction(payload: {
  identifier: string;
  password: string;
  fullName: string;
  gender: Gender;
  dateOfBirth: string;
  avatarUrl?: string;
}): Promise<AuthActionResult<{ redirectUrl: string }>> {
  const identifier = formatIdentifier(payload.identifier);
  if (!identifier || !payload.password || !payload.fullName) {
    return { success: false, error: "Vui lòng điền đầy đủ các thông tin bắt buộc." };
  }

  if (!process.env.FITAI_RPC_URL) {
    await persistSessionCookies("mock_access_token", "mock_refresh_token", "mock_user_id");
    return { success: true, data: { redirectUrl: "/onboarding" } };
  }

  try {
    const client = createClient(AuthService, createServerTransport());
    await client.register({
      identifier,
      password: payload.password,
      fullName: payload.fullName,
      gender: payload.gender,
      dateOfBirth: payload.dateOfBirth,
    });

    const loginRes = await client.login({ identifier, password: payload.password });
    await persistSessionCookies(loginRes.accessToken, loginRes.refreshToken, loginRes.userId);

    if (payload.avatarUrl) {
      try {
        const profileClient = createClient(
          ProfileService,
          createServerTransport(loginRes.accessToken),
        );
        await profileClient.updateIdentity({ avatarUrl: payload.avatarUrl });
      } catch {
        // Non-blocking avatar update
      }
    }

    return { success: true, data: { redirectUrl: "/onboarding" } };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Đăng ký không thành công. Vui lòng thử lại.";
    return { success: false, error: message };
  }
}
