import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockSendOtpAction = vi.fn();
const mockVerifyOtpAction = vi.fn();
const mockResetPasswordAction = vi.fn();

vi.mock("@/features/auth/server/auth-actions", () => ({
  sendOtpAction: (...args: unknown[]) => mockSendOtpAction(...args),
  verifyOtpAction: (...args: unknown[]) => mockVerifyOtpAction(...args),
  resetPasswordAction: (...args: unknown[]) => mockResetPasswordAction(...args),
}));

import { useForgotPasswordFlow } from "@/features/auth/model/use-forgot-password-flow";

describe("useForgotPasswordFlow hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initializes in IDENTIFIER step with empty state", () => {
    const { result } = renderHook(() => useForgotPasswordFlow());

    expect(result.current.step).toBe("IDENTIFIER");
    expect(result.current.identifier).toBe("");
    expect(result.current.isIdentifierValid).toBe(false);
    expect(result.current.errorMessage).toBeNull();
    expect(result.current.isPending).toBe(false);
  });

  describe("handleSendOtp", () => {
    it("sets error when identifier is invalid and does not advance", async () => {
      const { result } = renderHook(() => useForgotPasswordFlow());

      act(() => {
        result.current.setIdentifier("invalid-input");
      });

      await act(async () => {
        await result.current.handleSendOtp();
      });

      expect(result.current.step).toBe("IDENTIFIER");
      expect(result.current.errorMessage).toContain("valid email or phone");
      expect(mockSendOtpAction).not.toHaveBeenCalled();
    });

    it("advances to VERIFY_OTP and stores otpToken on success", async () => {
      mockSendOtpAction.mockResolvedValueOnce({
        success: true,
        data: { otpToken: "tok_otp_123", expiresInSeconds: 60 },
      });

      const { result } = renderHook(() => useForgotPasswordFlow());

      act(() => {
        result.current.setIdentifier("test@example.com");
      });

      await act(async () => {
        await result.current.handleSendOtp();
      });

      expect(mockSendOtpAction).toHaveBeenCalledWith("test@example.com", "reset_password");
      expect(result.current.step).toBe("VERIFY_OTP");
      expect(result.current.otpToken).toBe("tok_otp_123");
      expect(result.current.errorMessage).toBeNull();
    });

    it("advances to VERIFY_OTP even when backend fails (anti-enumeration)", async () => {
      mockSendOtpAction.mockResolvedValueOnce({
        success: false,
        error: "Account not found",
      });

      const { result } = renderHook(() => useForgotPasswordFlow());

      act(() => {
        result.current.setIdentifier("0912345678");
      });

      await act(async () => {
        await result.current.handleSendOtp();
      });

      expect(mockSendOtpAction).toHaveBeenCalledWith("0912345678", "reset_password");
      // Anti-enumeration: still advances to VERIFY_OTP
      expect(result.current.step).toBe("VERIFY_OTP");
    });
  });

  describe("handleVerifyOtp", () => {
    it("advances to NEW_PASSWORD when OTP verification succeeds with resetToken", async () => {
      mockSendOtpAction.mockResolvedValueOnce({
        success: true,
        data: { otpToken: "tok_otp_123", expiresInSeconds: 60 },
      });
      mockVerifyOtpAction.mockResolvedValueOnce({
        success: true,
        data: { valid: true, resetToken: "tok_reset_abc" },
      });

      const { result } = renderHook(() => useForgotPasswordFlow());

      act(() => {
        result.current.setIdentifier("test@example.com");
      });

      await act(async () => {
        await result.current.handleSendOtp();
      });

      await act(async () => {
        await result.current.handleVerifyOtp("123456");
      });

      expect(mockVerifyOtpAction).toHaveBeenCalledWith("tok_otp_123", "123456");
      expect(result.current.step).toBe("NEW_PASSWORD");
      expect(result.current.errorMessage).toBeNull();
    });

    it("displays error message when OTP verification fails", async () => {
      mockSendOtpAction.mockResolvedValueOnce({
        success: true,
        data: { otpToken: "tok_otp_123", expiresInSeconds: 60 },
      });
      mockVerifyOtpAction.mockResolvedValueOnce({
        success: false,
        error: "Invalid verification code",
      });

      const { result } = renderHook(() => useForgotPasswordFlow());

      act(() => {
        result.current.setIdentifier("test@example.com");
      });

      await act(async () => {
        await result.current.handleSendOtp();
      });

      await act(async () => {
        await result.current.handleVerifyOtp("000000");
      });

      expect(result.current.step).toBe("VERIFY_OTP");
      expect(result.current.errorMessage).toBe("Invalid verification code");
    });
  });

  describe("handleResetPassword", () => {
    it("validates minimum password length before calling server action", async () => {
      const { result } = renderHook(() => useForgotPasswordFlow());

      await act(async () => {
        await result.current.handleResetPassword("short", "short");
      });

      expect(result.current.errorMessage).toContain("8 characters");
      expect(mockResetPasswordAction).not.toHaveBeenCalled();
    });

    it("validates password confirmation match before calling server action", async () => {
      const { result } = renderHook(() => useForgotPasswordFlow());

      await act(async () => {
        await result.current.handleResetPassword("password123", "mismatch123");
      });

      expect(result.current.errorMessage).toContain("do not match");
      expect(mockResetPasswordAction).not.toHaveBeenCalled();
    });

    it("advances to SUCCESS when password reset succeeds", async () => {
      mockResetPasswordAction.mockResolvedValueOnce({
        success: true,
        data: { message: "Password reset successful" },
      });

      const { result } = renderHook(() => useForgotPasswordFlow());

      await act(async () => {
        await result.current.handleResetPassword("newPassword123", "newPassword123");
      });

      expect(result.current.step).toBe("SUCCESS");
      expect(result.current.errorMessage).toBeNull();
    });

    it("handles expired reset session gracefully", async () => {
      mockResetPasswordAction.mockResolvedValueOnce({
        success: false,
        error: "Token has expired",
      });

      const { result } = renderHook(() => useForgotPasswordFlow());

      await act(async () => {
        await result.current.handleResetPassword("newPassword123", "newPassword123");
      });

      expect(result.current.step).toBe("IDENTIFIER"); // remains on step
      expect(result.current.errorMessage).toContain("Reset session has expired. Please start over.");
    });
  });

  describe("navigation helpers", () => {
    it("goToIdentifierStep resets to IDENTIFIER step and clears tokens", async () => {
      mockSendOtpAction.mockResolvedValueOnce({
        success: true,
        data: { otpToken: "tok_123", expiresInSeconds: 60 },
      });

      const { result } = renderHook(() => useForgotPasswordFlow());

      act(() => {
        result.current.setIdentifier("user@test.com");
      });

      await act(async () => {
        await result.current.handleSendOtp();
      });

      expect(result.current.step).toBe("VERIFY_OTP");

      act(() => {
        result.current.goToIdentifierStep();
      });

      expect(result.current.step).toBe("IDENTIFIER");
      expect(result.current.otpToken).toBe("");
    });

    it("reset clears all state completely", () => {
      const { result } = renderHook(() => useForgotPasswordFlow());

      act(() => {
        result.current.setIdentifier("user@test.com");
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.step).toBe("IDENTIFIER");
      expect(result.current.identifier).toBe("");
      expect(result.current.otpToken).toBe("");
      expect(result.current.errorMessage).toBeNull();
    });
  });
});
