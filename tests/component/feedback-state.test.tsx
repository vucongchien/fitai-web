import { describe, expect, it } from 'vitest';
import { describe, expect, it, vi } from '@jest/globals';
import { render, screen } from "@testing-library/react";

import { FeedbackState } from "@/shared/ui/feedback-state";

vi.mock<typeof import('next/link')>(import('next/link'), () => ({
  default: ({ children, href, ...props }: React.ComponentPropsWithRef<"a">) => (
    <a href={href as string} {...props}>
      {children}
    </a>
  ),
}));

describe(FeedbackState, () => {
  describe("empty tone (default)", () => {
    it("renders title and description", () => {
      render(
        <FeedbackState
          title="No workouts yet"
          description="Start your first session to track progress"
        />,
      );

      expect(screen.getByRole("heading", { name: /no workouts yet/i })).toBeInTheDocument();
      expect(
        screen.getByText(/start your first session to track progress/i),
      ).toBeInTheDocument();
    });

    it("hides the decorative icon from assistive technology", () => {
      const { container } = render(
        <FeedbackState title="Empty" description="Nothing here" />,
      );

      const iconWrapper = container.querySelector(".feedback-state__icon");
      expect(iconWrapper).toHaveAttribute("aria-hidden", "true");
    });

    it("omits the action link when actionHref/actionLabel are not provided", () => {
      render(<FeedbackState title="Empty" description="Nothing here" />);

      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });
  });

  describe("error tone", () => {
    it("renders with data-tone='error' for styling", () => {
      const { container } = render(
        <FeedbackState
          tone="error"
          title="Something went wrong"
          description="We could not load your data"
        />,
      );

      expect(container.querySelector(".feedback-state")).toHaveAttribute("data-tone", "error");
    });
  });

  describe("action link", () => {
    it("renders a named link when actionHref and actionLabel are both provided", () => {
      render(
        <FeedbackState
          title="No plan yet"
          description="Create your plan to get started"
          actionHref="/onboarding"
          actionLabel="Create plan"
        />,
      );

      const link = screen.getByRole("link", { name: /create plan/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/onboarding");
    });

    it("hides the decorative ArrowRight icon inside the action link", () => {
      const { container } = render(
        <FeedbackState
          title="No plan yet"
          description="Create your plan"
          actionHref="/onboarding"
          actionLabel="Create plan"
        />,
      );

      const arrowIcon = container.querySelector(".text-action svg[aria-hidden='true']");
      expect(arrowIcon).not.toBeNull();
    });
  });
});
