import { fireEvent, render, screen } from "@testing-library/react";
import type { MouseEventHandler } from "react";
import { describe, expect, it, vi } from "vitest";

import { Button } from "@/shared/ui/button";

describe("Button", () => {
  it("exposes its loading state and prevents duplicate actions", () => {
    const onClick = vi.fn<MouseEventHandler<HTMLButtonElement>>();
    render(
      <Button loading onClick={onClick}>
        Save changes
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Save changes" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("data-loading", "true");
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});
