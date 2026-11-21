import { describe, expect, it, vi } from "vitest";

// Mock next/font/local to avoid file reading issues in test environment
vi.mock("next/font/local", () => ({
  default: () => () => ({
    variable: "--font-mock",
  }),
}));

// Mock CSS imports
vi.mock("@/app/globals.css", () => ({}));

describe("Mobile Viewport & Metadata Configuration", () => {
  it("exports viewport with viewportFit cover and initialScale 1 for mobile notch/home-bar support", async () => {
    const { viewport } = await import("@/app/layout");

    expect(viewport).toBeDefined();
    expect(viewport.width).toBe("device-width");
    expect(viewport.viewportFit).toBe("cover");
    expect(viewport.initialScale).toBe(1);
    expect(viewport.themeColor).toBe("#f7f8f6");
  });

  it("exports metadata with appleWebApp and apple touch icons for standalone iOS PWA", async () => {
    const { metadata } = await import("@/app/layout");

    expect(metadata).toBeDefined();
    expect(metadata.manifest).toBe("/manifest.webmanifest");
    expect(metadata.appleWebApp).toEqual({
      capable: true,
      statusBarStyle: "default",
      title: "FITAI",
    });
    expect(metadata.icons).toEqual({
      icon: [{ url: "/icons/icon-192.png?v=2", sizes: "192x192", type: "image/png" }],
      shortcut: "/icons/icon-192.png?v=2",
      apple: "/icons/icon-192.png?v=2",
    });
  });
});
