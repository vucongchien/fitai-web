import { render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";

import { AppHeader } from "@/shared/ui/app-header";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentPropsWithRef<"a">) => (
    <a href={href as string} {...props}>
      {children}
    </a>
  ),
}));

// HeaderActions and BrandMark are not under test here
vi.mock("@/shared/ui/header-actions", () => ({
  HeaderActions: () => <div data-testid="header-actions" />,
}));

vi.mock("@/shared/ui/brand-mark", () => ({
  BrandMark: () => <span data-testid="brand-mark" />,
}));

describe("AppHeader", () => {
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
