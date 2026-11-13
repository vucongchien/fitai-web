import { Code, ConnectError } from "@connectrpc/connect";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AdminGate } from "@/app/(admin)/admin/layout";
import * as exerciseService from "@/features/admin/api/admin-exercise-service";
import * as sessionModule from "@/shared/auth/session";

const mockRedirect = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    mockRedirect(url);
    throw new Error(`REDIRECT:${url}`);
  },
  usePathname: () => "/admin",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/features/admin/ui/admin-sidebar", () => ({
  AdminSidebar: ({ pendingApprovalCount }: { pendingApprovalCount: number }) => (
    <div data-testid="admin-sidebar" data-pending={pendingApprovalCount}>
      Sidebar
    </div>
  ),
}));

vi.mock("@/features/admin/ui/admin-query-provider", () => ({
  AdminQueryProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="admin-query-provider">{children}</div>
  ),
}));

describe("AdminGate Access Control & gRPC Backend Verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("redirects to /login when user has no access token", async () => {
    vi.spyOn(sessionModule, "getAuthenticatedSession").mockResolvedValue({
      accessToken: undefined,
    });

    await expect(AdminGate({ children: <div>Child</div> })).rejects.toThrow(
      "REDIRECT:/login?redirect=/admin",
    );
    expect(mockRedirect).toHaveBeenCalledWith("/login?redirect=/admin");
  });

  it("shows AdminForbiddenView when user has token but role is not ADMIN", async () => {
    vi.spyOn(sessionModule, "getAuthenticatedSession").mockResolvedValue({
      accessToken: "user_token",
      role: "USER",
      userName: "Regular User",
    });
    vi.spyOn(sessionModule, "isAdmin").mockResolvedValue(false);

    const jsx = await AdminGate({ children: <div>Child</div> });
    render(jsx);

    expect(screen.getByText(/Access Denied/i)).toBeInTheDocument();
  });

  it("redirects to /login when gRPC backend returns Code.Unauthenticated for forged token", async () => {
    vi.spyOn(sessionModule, "getAuthenticatedSession").mockResolvedValue({
      accessToken: "forged_tampered_token",
      role: "ADMIN",
      userName: "Attacker",
    });
    vi.spyOn(sessionModule, "isAdmin").mockResolvedValue(true);
    vi.spyOn(exerciseService, "fetchAdminExercises").mockRejectedValue(
      new ConnectError("Invalid or forged token", Code.Unauthenticated),
    );

    await expect(AdminGate({ children: <div>Child</div> })).rejects.toThrow(
      "REDIRECT:/login?redirect=/admin",
    );
    expect(mockRedirect).toHaveBeenCalledWith("/login?redirect=/admin");
  });

  it("shows AdminForbiddenView when gRPC backend returns Code.PermissionDenied", async () => {
    vi.spyOn(sessionModule, "getAuthenticatedSession").mockResolvedValue({
      accessToken: "valid_token_but_not_admin",
      role: "ADMIN",
      userName: "User Without Permission",
    });
    vi.spyOn(sessionModule, "isAdmin").mockResolvedValue(true);
    vi.spyOn(exerciseService, "fetchAdminExercises").mockRejectedValue(
      new ConnectError("Permission denied", Code.PermissionDenied),
    );

    const jsx = await AdminGate({ children: <div>Child</div> });
    render(jsx);

    expect(screen.getByText(/Access Denied/i)).toBeInTheDocument();
  });

  it("renders Admin Dashboard with sidebar and children for valid admin", async () => {
    vi.spyOn(sessionModule, "getAuthenticatedSession").mockResolvedValue({
      accessToken: "valid_admin_token",
      role: "ADMIN",
      userName: "Super Admin",
    });
    vi.spyOn(sessionModule, "isAdmin").mockResolvedValue(true);
    vi.spyOn(exerciseService, "fetchAdminExercises").mockResolvedValue({
      items: [],
      nextCursor: null,
      totalCount: 5,
    });

    const jsx = await AdminGate({ children: <div data-testid="admin-content">Admin Content</div> });
    render(jsx);

    expect(screen.getByTestId("admin-sidebar")).toHaveAttribute("data-pending", "5");
    expect(screen.getByTestId("admin-content")).toBeInTheDocument();
    expect(screen.getByText(/Admin Mode Active \(Super Admin\)/i)).toBeInTheDocument();
  });
});
