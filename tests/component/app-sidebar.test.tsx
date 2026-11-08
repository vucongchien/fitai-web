import { render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { describe, expect, it, vi } from "vitest";

import { AppSidebar } from "@/shared/ui/app-sidebar";

vi.mock<typeof import("next/navigation")>(import("next/navigation"), () => ({
  usePathname: vi.fn(),
}));

vi.mock<typeof import("next/link")>(import("next/link"), () => ({
  default: ({ children, href, ...props }: React.ComponentPropsWithRef<"a">) => (
    <a href={href as string} {...props}>
      {children}
    </a>
  ),
}));

describe(AppSidebar, () => {
  it("renders a complementary desktop navigation landmark", () => {
    vi.mocked(usePathname).mockReturnValue("/home");
    render(<AppSidebar />);

    expect(screen.getByRole("complementary", { name: /desktop navigation/i })).toBeInTheDocument();
  });

  it("marks the active route with aria-current='page'", () => {
    vi.mocked(usePathname).mockReturnValue("/nutrition");
    render(<AppSidebar />);

    const activeLink = screen.getByRole("link", { name: /nutrition/i });
    expect(activeLink).toHaveAttribute("aria-current", "page");
  });

  it("does not set aria-current on inactive routes", () => {
    vi.mocked(usePathname).mockReturnValue("/nutrition");
    render(<AppSidebar />);

    const homeLink = screen.getByRole("link", { name: /today/i });
    expect(homeLink).not.toHaveAttribute("aria-current");
  });

  it("renders all 6 core navigation destinations and settings", () => {
    vi.mocked(usePathname).mockReturnValue("/home");
    render(<AppSidebar />);

    expect(screen.getByRole("link", { name: /today/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /nutrition/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /workout/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /arena/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /community/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /profile/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /settings/i })).toBeInTheDocument();
  });

  it("treats /schedule sub-paths as the Workout route being active", () => {
    vi.mocked(usePathname).mockReturnValue("/schedule");
    render(<AppSidebar />);

    const workoutLink = screen.getByRole("link", { name: /workout/i });
    expect(workoutLink).toHaveAttribute("aria-current", "page");
  });

  it("hides decorative icons from assistive technology", () => {
    vi.mocked(usePathname).mockReturnValue("/home");
    const { container } = render(<AppSidebar />);

    const hiddenSvgs = container.querySelectorAll("svg[aria-hidden='true']");
    expect(hiddenSvgs.length).toBeGreaterThanOrEqual(7);
  });
});
