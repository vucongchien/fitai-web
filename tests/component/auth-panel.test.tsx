import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AuthPanel } from "@/features/auth/ui/auth-panel";

// Mock router and actions
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/features/auth/server/auth-actions", () => ({
  sendOtpAction: vi.fn(),
  verifyOtpAction: vi.fn(),
  registerAction: vi.fn(),
  resetPasswordAction: vi.fn(),
}));

describe("AuthPanel component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders with 'Log in' title initially", () => {
    render(<AuthPanel />);
    const title = screen.getByRole("heading", { level: 2 });
    expect(title).toHaveTextContent("Log in");
  });

  it("switches title to 'Create your account' when clicking register switch link", () => {
    render(<AuthPanel />);
    const registerLink = screen.getByRole("button", { name: /Create your account/i });
    fireEvent.click(registerLink);

    const title = screen.getByRole("heading", { level: 2 });
    expect(title).toHaveTextContent("Create your account");
  });

  it("switches title back to 'Log in' when switching back from register", () => {
    render(<AuthPanel />);
    // Switch to register
    fireEvent.click(screen.getByRole("button", { name: /Create your account/i }));
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Create your account");

    // Switch back to login
    fireEvent.click(screen.getByRole("button", { name: /^Log in$/i }));
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Log in");
  });

  it("renders 'Check your phone' as single header when OTP is sent for phone", async () => {
    const { sendOtpAction } = await import("@/features/auth/server/auth-actions");
    (sendOtpAction as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      success: true,
      data: { otpToken: "dummy-token", expiresInSeconds: 60 },
    });

    render(<AuthPanel />);
    fireEvent.click(screen.getByRole("button", { name: /Create your account/i }));

    const input = screen.getByLabelText(/Email or phone/i);
    fireEvent.change(input, { target: { value: "0912345678" } });

    const sendBtn = screen.getByRole("button", { name: /Send verification code/i });
    fireEvent.click(sendBtn);

    const title = await screen.findByRole("heading", { level: 2, name: /Check your phone/i });
    expect(title).toBeInTheDocument();
    // Ensure no redundant h3 exists
    expect(screen.queryByRole("heading", { level: 3 })).not.toBeInTheDocument();
    // Ensure inline Change button exists
    expect(screen.getByRole("button", { name: /Change/i })).toBeInTheDocument();
  });

  it("renders 'Check your email' when OTP is sent for email and allows changing identifier", async () => {
    const { sendOtpAction } = await import("@/features/auth/server/auth-actions");
    (sendOtpAction as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      success: true,
      data: { otpToken: "dummy-token", expiresInSeconds: 60 },
    });

    render(<AuthPanel />);
    fireEvent.click(screen.getByRole("button", { name: /Create your account/i }));

    const input = screen.getByLabelText(/Email or phone/i);
    fireEvent.change(input, { target: { value: "test@gmail.com" } });

    const sendBtn = screen.getByRole("button", { name: /Send verification code/i });
    fireEvent.click(sendBtn);

    const title = await screen.findByRole("heading", { level: 2, name: /Check your email/i });
    expect(title).toBeInTheDocument();

    const emailLink = screen.getByRole("link", { name: /t•••@gmail.com/i });
    expect(emailLink).toHaveAttribute("href", "https://mail.google.com");
    expect(emailLink).toHaveAttribute("target", "_blank");
    expect(emailLink).toHaveAttribute("rel", "noopener noreferrer");

    // Click Change to go back
    fireEvent.click(screen.getByRole("button", { name: /Change/i }));
    expect(
      await screen.findByRole("heading", { level: 2, name: /Create your account/i }),
    ).toBeInTheDocument();
  });

  it("switches to 'Reset password' when clicking 'Forgot password?'", () => {
    render(<AuthPanel />);
    const forgotLink = screen.getByRole("button", { name: /Forgot password\?/i });
    fireEvent.click(forgotLink);

    expect(screen.getByRole("heading", { level: 2, name: /Reset password/i })).toBeInTheDocument();
  });

  it("switches back to 'Log in' from forgot password when clicking 'Back to login'", () => {
    render(<AuthPanel />);
    fireEvent.click(screen.getByRole("button", { name: /Forgot password\?/i }));
    expect(screen.getByRole("heading", { level: 2, name: /Reset password/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Back to login/i }));
    expect(screen.getByRole("heading", { level: 2, name: /^Log in$/i })).toBeInTheDocument();
  });

  it("progresses to OTP step in forgot password flow when entering identifier", async () => {
    const { sendOtpAction } = await import("@/features/auth/server/auth-actions");
    (sendOtpAction as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      success: true,
      data: { otpToken: "reset-dummy-token", expiresInSeconds: 60 },
    });

    render(<AuthPanel />);
    fireEvent.click(screen.getByRole("button", { name: /Forgot password\?/i }));

    const input = screen.getByLabelText(/Email or phone/i);
    fireEvent.change(input, { target: { value: "reset@gmail.com" } });

    const sendBtn = screen.getByRole("button", { name: /Send verification code/i });
    fireEvent.click(sendBtn);

    const title = await screen.findByRole("heading", { level: 2, name: /Check your email/i });
    expect(title).toBeInTheDocument();
  });
});
