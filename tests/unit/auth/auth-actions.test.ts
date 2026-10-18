import { beforeEach, describe, expect, it, vi } from "vitest";

const mockSetCookie = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    set: mockSetCookie,
    get: vi.fn(),
  })),
}));

const mockSendOTP = vi.fn();
const mockVerifyOTP = vi.fn();
const mockResetPassword = vi.fn();
const mockLogin = vi.fn();
const mockRegister = vi.fn();
const mockGetProfile = vi.fn();
const mockUpdateProfile = vi.fn();

vi.mock("@connectrpc/connect", () => ({
  createClient: vi.fn(() => ({
    sendOTP: mockSendOTP,
    verifyOTP: mockVerifyOTP,
    resetPassword: mockResetPassword,
    login: mockLogin,
    register: mockRegister,
    getProfile: mockGetProfile,
    updateProfile: mockUpdateProfile,
  })),
}));

vi.mock("@/shared/api/server/transport", () => ({
  createServerTransport: vi.fn(() => ({})),
}));

import { Gender } from "@/shared/api/gen/contracts/generic/auth/v1/message/auth_messages_pb";
import {
  loginWithPasswordAction,
  registerAction,
  resetPasswordAction,
  sendOtpAction,
  verifyOtpAction,
} from "@/features/auth/server/auth-actions";

describe("auth-actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.FITAI_RPC_URL = "http://localhost:50051";
  });

  describe("sendOtpAction", () => {
    it("returns error for empty or invalid identifier", async () => {
      const res = await sendOtpAction("", "login");
      expect(res.success).toBe(false);
      expect(res.error).toContain("valid");
    });

    it("normalizes phone and calls sendOTP RPC successfully", async () => {
      mockSendOTP.mockResolvedValueOnce({
        otpToken: "token_123",
        expiresInSeconds: 60n,
      });

      const res = await sendOtpAction("0901234567", "login");
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.otpToken).toBe("token_123");
        expect(res.data.expiresInSeconds).toBe(60);
      }
      expect(mockSendOTP).toHaveBeenCalledWith({
        identifier: "+84901234567",
        purpose: "login",
      });
    });

    it("sends OTP for reset_password purpose correctly", async () => {
      mockSendOTP.mockResolvedValueOnce({
        otpToken: "reset_otp_token",
        expiresInSeconds: 120n,
      });

      const res = await sendOtpAction("user@example.com", "reset_password");
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.otpToken).toBe("reset_otp_token");
        expect(res.data.expiresInSeconds).toBe(120);
      }
      expect(mockSendOTP).toHaveBeenCalledWith({
        identifier: "user@example.com",
        purpose: "reset_password",
      });
    });
  });

  describe("verifyOtpAction", () => {
    it("rejects code not having 6 digits", async () => {
      const res = await verifyOtpAction("tok", "123");
      expect(res.success).toBe(false);
      expect(res.error).toContain("6 digits");
    });

    it("returns valid response when RPC returns valid true", async () => {
      mockVerifyOTP.mockResolvedValueOnce({
        valid: true,
        resetToken: "reset_xyz",
      });

      const res = await verifyOtpAction("tok_123", "654321");
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.valid).toBe(true);
        expect(res.data.resetToken).toBe("reset_xyz");
      }
    });

    it("handles invalid OTP correctly", async () => {
      mockVerifyOTP.mockResolvedValueOnce({
        valid: false,
        message: "Mã sai rồi",
      });

      const res = await verifyOtpAction("tok_123", "000000");
      expect(res.success).toBe(false);
      expect(res.error).toBe("Invalid verification code. Please check and try again.");
    });
  });

  describe("loginWithPasswordAction", () => {
    it("logs in, sets cookies, and resolves redirect route", async () => {
      mockLogin.mockResolvedValueOnce({
        accessToken: "access_token_abc",
        refreshToken: "refresh_token_xyz",
        userId: "usr_1",
      });
      mockGetProfile.mockResolvedValueOnce({ completionRate: 90 });

      const res = await loginWithPasswordAction("0901234567", "password123");
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.redirectUrl).toBe("/home");
      }
      expect(mockSetCookie).toHaveBeenCalledWith(
        "fitai_access_token",
        "access_token_abc",
        expect.any(Object),
      );
    });
  });

  describe("registerAction", () => {
    it("registers user, logs in automatically, and redirects to onboarding", async () => {
      mockRegister.mockResolvedValueOnce({ message: "Registered" });
      mockLogin.mockResolvedValueOnce({
        accessToken: "access_new",
        refreshToken: "refresh_new",
        userId: "usr_new",
      });

      const res = await registerAction({
        identifier: "0901234567",
        password: "secure_pass_123",
        fullName: "Nguyen Van A",
        gender: Gender.MALE,
        dateOfBirth: "1995-01-01",
      });

      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.redirectUrl).toBe("/onboarding");
      }
      expect(mockRegister).toHaveBeenCalledWith({
        identifier: "+84901234567",
        password: "secure_pass_123",
        fullName: "Nguyen Van A",
        gender: Gender.MALE,
        dateOfBirth: "1995-01-01",
      });
    });
  });

  describe("resetPasswordAction", () => {
    it("rejects when resetToken is empty", async () => {
      const res = await resetPasswordAction("", "newpassword123", "newpassword123");
      expect(res.success).toBe(false);
      expect(res.error).toContain("invalid");
    });

    it("rejects when password is shorter than 8 characters", async () => {
      const res = await resetPasswordAction("tok_123", "short", "short");
      expect(res.success).toBe(false);
      expect(res.error).toContain("8 characters");
    });

    it("rejects when newPassword and confirmPassword do not match", async () => {
      const res = await resetPasswordAction("tok_123", "password123", "different123");
      expect(res.success).toBe(false);
      expect(res.error).toContain("do not match");
    });

    it("calls resetPassword RPC and succeeds", async () => {
      mockResetPassword.mockResolvedValueOnce({
        message: "Password has been reset successfully",
      });

      const res = await resetPasswordAction("tok_valid", "newpassword123", "newpassword123");
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.message).toBe("Password has been reset successfully");
      }
      expect(mockResetPassword).toHaveBeenCalledWith({
        resetToken: "tok_valid",
        newPassword: "newpassword123",
        confirmPassword: "newpassword123",
      });
    });

    it("handles RPC failure gracefully", async () => {
      mockResetPassword.mockRejectedValueOnce(new Error("Token has expired"));

      const res = await resetPasswordAction("tok_expired", "newpassword123", "newpassword123");
      expect(res.success).toBe(false);
      expect(res.error).toBe("Token has expired");
    });
  });
});
