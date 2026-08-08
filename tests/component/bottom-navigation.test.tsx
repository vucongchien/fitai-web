import { describe, expect, it, vi } from '@jest/globals';
import { render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";

import { BottomNavigation } from "@/shared/ui/bottom-navigation";

vi.mock<typeof import('next/navigation')>(import('next/navigation'), () => ({
  usePathname: vi.fn(),
}));

vi.mock<typeof import('next/link')>(import('next/link'), () => ({
  default: ({ children, href, ...props }: React.ComponentPropsWithRef<"a">) => (
    <a href={href as string} {...props}>
      {children}
    </a>
  ),
}));

describe(BottomNavigation, () => {
  it("renders a nav landmark with descriptive aria-label", () => {
    vi.mocked(usePathname).mockReturnValue("/home");
    render(<BottomNavigation />);

    expect(screen.getByRole("navigation", { name: /primary navigation/i })).toBeInTheDocument();
  });

  it("marks the active route with aria-current='page'", () => {
    vi.mocked(usePathname).mockReturnValue("/nutrition");
    render(<BottomNavigation />);

    const activeLink = screen.getByRole("link", { name: /nutrition/i });
    expect(activeLink).toHaveAttribute("aria-current", "page");
  });

  it("does NOT set aria-current on inactive routes", () => {
    vi.mocked(usePathname).mockReturnValue("/nutrition");
    render(<BottomNavigation />);

    const homeLink = screen.getByRole("link", { name: /today/i });
    expect(homeLink).not.toHaveAttribute("aria-current");

    const profileLink = screen.getByRole("link", { name: /profile/i });
    expect(profileLink).not.toHaveAttribute("aria-current");
  });

  it("renders all 4 navigation destinations", () => {
    vi.mocked(usePathname).mockReturnValue("/home");
    render(<BottomNavigation />);

    expect(screen.getByRole("link", { name: /today/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /nutrition/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /workout/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /profile/i })).toBeInTheDocument();
  });

  it("treats /schedule sub-paths as the Workout route being active", () => {
    vi.mocked(usePathname).mockReturnValue("/schedule");
    render(<BottomNavigation />);

    const workoutLink = screen.getByRole("link", { name: /workout/i });
    expect(workoutLink).toHaveAttribute("aria-current", "page");
  });

  it("hides decorative icons from assistive technology", () => {
    vi.mocked(usePathname).mockReturnValue("/home");
    const { container } = render(<BottomNavigation />);

    const hiddenSvgs = container.querySelectorAll("svg[aria-hidden='true']");
    // 4 nav icons should all be aria-hidden
    expect(hiddenSvgs.length).toBeGreaterThanOrEqual(4);
  });
});
