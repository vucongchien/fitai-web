import { describe, expect, it } from 'vitest';
import { describe, expect, it, vi } from '@jest/globals';
import { render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";

import { AppHeader } from "@/shared/ui/app-header";

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

// HeaderActions and BrandMark are not under test here
vi.mock<typeof import('@/shared/ui/header-actions')>(import('@/shared/ui/header-actions'), () => ({
  HeaderActions: () => <div data-testid="header-actions" />,
}));

vi.mock<typeof import('@/shared/ui/brand-mark')>(import('@/shared/ui/brand-mark'), () => ({
  BrandMark: () => <span data-testid="brand-mark" />,
}));

describe(AppHeader, () => {
  it("renders a <header> landmark", () => {
    vi.mocked(usePathname).mockReturnValue("/home");
    render(<AppHeader />);

    expect(screen.getByRole("banner")).toBeInTheDocument();
  });

  it("shows BrandMark on top-level routes without a back destination", () => {
    vi.mocked(usePathname).mockReturnValue("/home");
    render(<AppHeader />);

    expect(screen.getByTestId("brand-mark")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /back to/i })).not.toBeInTheDocument();
  });

  it("shows a back link with accessible name when inside /nutrition sub-route", () => {
    vi.mocked(usePathname).mockReturnValue("/nutrition/breakfast");
    render(<AppHeader />);

    const backLink = screen.getByRole("link", { name: /back to nutrition/i });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute("href", "/nutrition");
  });

  it("shows a back link pointing to Roadmap for /roadmap sub-routes", () => {
    vi.mocked(usePathname).mockReturnValue("/roadmap/upper-body");
    render(<AppHeader />);

    const backLink = screen.getByRole("link", { name: /back to roadmap/i });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute("href", "/roadmap");
  });

  it("shows a back link pointing to Roadmap for /schedule routes", () => {
    vi.mocked(usePathname).mockReturnValue("/schedule");
    render(<AppHeader />);

    const backLink = screen.getByRole("link", { name: /back to roadmap/i });
    expect(backLink).toBeInTheDocument();
  });

  it("hides the decorative ArrowLeft icon from assistive technology", () => {
    vi.mocked(usePathname).mockReturnValue("/nutrition/lunch");
    const { container } = render(<AppHeader />);

    const hiddenSvg = container.querySelector("a svg[aria-hidden='true']");
    expect(hiddenSvg).not.toBeNull();
  });
});
