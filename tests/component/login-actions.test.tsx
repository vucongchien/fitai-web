import { it, afterEach, describe, expect, beforeEach } from 'vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from '@jest/globals';
/**
 * Component tests: LoginActions
 *
 * Kiểm tra popup OAuth flow trong LoginActions:
 *   - Popup được mở khi click Google/Facebook
 *   - Fallback sang full-page redirect nếu popup bị block
 *   - postMessage OAUTH_COMPLETE → navigate đúng dest
 *   - postMessage OAUTH_ERROR → reset pending (không navigate)
 *   - Popup đóng thủ công → reset pending
 *   - Không cho click khi đang pending
 */

import { cleanup, fireEvent, render, screen, act } from "@testing-library/react";
import type { Mock } from "vitest";

import { LoginActions } from "@/features/auth/ui/login-actions";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makePopupStub(closed = false): Window {
  return {
    closed,
    close: vi.fn<Window["close"]>(),
  } as unknown as Window;
}

describe(LoginActions, () => {
  let mockWindowOpen: ReturnType<typeof vi.spyOn>;
  let mockLocationAssign: Mock<Location["assign"]>;
  let capturedMessageHandler: ((e: MessageEvent) => void) | null = null;
  let realAddEventListener: typeof window.addEventListener;

  beforeEach(() => {
    vi.useFakeTimers();
    capturedMessageHandler = null;

    // Spy on window.open
    mockWindowOpen = vi.spyOn(window, "open");

    // Mock location.assign (location is not writable directly, use defineProperty)
    mockLocationAssign = vi.fn<Location["assign"]>();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...window.location, assign: mockLocationAssign, origin: "http://localhost:3000" },
    });

    // Capture the message handler registered by LoginActions
    realAddEventListener = window.addEventListener.bind(window);
    vi.spyOn(window, "addEventListener").mockImplementation((type, handler, options?) => {
      if (type === "message") {
        capturedMessageHandler = handler as (e: MessageEvent) => void;
      }
      realAddEventListener(type, handler as EventListenerOrEventListenerObject, options);
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  // ─── Render ─────────────────────────────────────────────────────────────────

  it("renders Google and Facebook buttons", () => {
    render(<LoginActions />);
    expect(screen.getByRole("button", { name: /Continue with Google/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Continue with Facebook/i })).toBeInTheDocument();
  });

  // ─── Popup opens ────────────────────────────────────────────────────────────

  it("opens a popup for Google when button is clicked", () => {
    const fakePopup = makePopupStub();
    mockWindowOpen.mockReturnValue(fakePopup);

    render(<LoginActions />);
    fireEvent.click(screen.getByRole("button", { name: /Continue with Google/i }));

    expect(mockWindowOpen).toHaveBeenCalledWith(
      "/api/auth/oauth/google?popup=1",
      "oauth_popup",
      expect.stringContaining("popup=yes"),
    );
  });

  it("opens a popup for Facebook when button is clicked", () => {
    const fakePopup = makePopupStub();
    mockWindowOpen.mockReturnValue(fakePopup);

    render(<LoginActions />);
    fireEvent.click(screen.getByRole("button", { name: /Continue with Facebook/i }));

    expect(mockWindowOpen).toHaveBeenCalledWith(
      "/api/auth/oauth/facebook?popup=1",
      "oauth_popup",
      expect.stringContaining("popup=yes"),
    );
  });

  // ─── Popup blocked fallback ──────────────────────────────────────────────────

  it("falls back to window.location.assign when popup is blocked", () => {
    mockWindowOpen.mockReturnValue(null); // Simula popup blocker

    render(<LoginActions />);
    fireEvent.click(screen.getByRole("button", { name: /Continue with Google/i }));

    expect(mockLocationAssign).toHaveBeenCalledWith("/api/auth/oauth/google?popup=1");
  });

  // ─── postMessage OAUTH_COMPLETE ──────────────────────────────────────────────

  it("navigates to dest on OAUTH_COMPLETE message from popup", () => {
    const fakePopup = makePopupStub();
    mockWindowOpen.mockReturnValue(fakePopup);

    render(<LoginActions />);
    fireEvent.click(screen.getByRole("button", { name: /Continue with Google/i }));

    // Simulate message from popup
    act(() => {
      capturedMessageHandler?.({
        origin: "http://localhost:3000",
        source: fakePopup,
        data: { type: "OAUTH_COMPLETE", dest: "/onboarding" },
      } as unknown as MessageEvent);
    });

    expect(mockLocationAssign).toHaveBeenCalledWith("/onboarding");
  });

  it("navigates to /home when dest is missing in OAUTH_COMPLETE", () => {
    const fakePopup = makePopupStub();
    mockWindowOpen.mockReturnValue(fakePopup);

    render(<LoginActions />);
    fireEvent.click(screen.getByRole("button", { name: /Continue with Google/i }));

    act(() => {
      capturedMessageHandler?.({
        origin: "http://localhost:3000",
        source: fakePopup,
        data: { type: "OAUTH_COMPLETE" },
      } as unknown as MessageEvent);
    });

    expect(mockLocationAssign).toHaveBeenCalledWith("/home");
  });

  it("ignores messages from different origins", () => {
    const fakePopup = makePopupStub();
    mockWindowOpen.mockReturnValue(fakePopup);

    render(<LoginActions />);
    fireEvent.click(screen.getByRole("button", { name: /Continue with Google/i }));

    act(() => {
      capturedMessageHandler?.({
        origin: "http://evil.com",
        source: fakePopup,
        data: { type: "OAUTH_COMPLETE", dest: "/home" },
      } as unknown as MessageEvent);
    });

    expect(mockLocationAssign).not.toHaveBeenCalled();
  });

  // ─── postMessage OAUTH_ERROR ─────────────────────────────────────────────────

  it("does not navigate on OAUTH_ERROR – resets pending state", () => {
    const fakePopup = makePopupStub();
    mockWindowOpen.mockReturnValue(fakePopup);

    render(<LoginActions />);
    const googleButton = screen.getByRole("button", { name: /Continue with Google/i });
    fireEvent.click(googleButton);

    // Should be pending (disabled)
    expect(googleButton).toBeDisabled();

    act(() => {
      capturedMessageHandler?.({
        origin: "http://localhost:3000",
        source: fakePopup,
        data: { type: "OAUTH_ERROR", message: "access_denied" },
      } as unknown as MessageEvent);
    });

    // After error, pending resets → button enabled
    expect(googleButton).not.toBeDisabled();
    expect(mockLocationAssign).not.toHaveBeenCalled();
  });

  // ─── Popup closed manually ───────────────────────────────────────────────────

  it("resets pending when user manually closes the popup", () => {
    const fakePopup = makePopupStub(false);
    mockWindowOpen.mockReturnValue(fakePopup);

    render(<LoginActions />);
    const googleButton = screen.getByRole("button", { name: /Continue with Google/i });
    fireEvent.click(googleButton);
    expect(googleButton).toBeDisabled();

    // Simulate popup being closed
    (fakePopup as { closed: boolean }).closed = true;
    act(() => {
      vi.advanceTimersByTime(600); // > 500ms poll interval
    });

    expect(googleButton).not.toBeDisabled();
  });

  // ─── No duplicate clicks ─────────────────────────────────────────────────────

  it("does not open a second popup while one is pending", () => {
    const fakePopup = makePopupStub();
    mockWindowOpen.mockReturnValue(fakePopup);

    render(<LoginActions />);
    const googleButton = screen.getByRole("button", { name: /Continue with Google/i });
    fireEvent.click(googleButton);
    // Second click is blocked by disabled state
    fireEvent.click(googleButton);

    expect(mockWindowOpen).toHaveBeenCalledTimes(1);
  });

  // ─── Dev Mode Shortcuts ───────────────────────────────────────────────────────

  it("triggers dev login for new user when clicked in dev mode", () => {
    vi.stubEnv("NODE_ENV", "development");
    render(<LoginActions />);
    const devNewButton = screen.getByRole("button", { name: /⚡ Dev: New User/i });
    fireEvent.click(devNewButton);

    expect(mockLocationAssign).toHaveBeenCalledWith("/api/auth/dev-login?target=new");
  });

  it("triggers dev login for existing user when clicked in dev mode", () => {
    vi.stubEnv("NODE_ENV", "development");
    render(<LoginActions />);
    const devExistingButton = screen.getByRole("button", { name: /⚡ Dev: Existing User/i });
    fireEvent.click(devExistingButton);

    expect(mockLocationAssign).toHaveBeenCalledWith("/api/auth/dev-login?target=existing");
  });
});
