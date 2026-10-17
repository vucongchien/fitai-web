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
});
