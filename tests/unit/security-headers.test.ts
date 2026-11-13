import { describe, expect, it } from "vitest";

import nextConfig from "../../next.config";

describe("HTTP Security Headers (next.config.ts)", () => {
  it("defines global security headers for all routes (/:path*)", async () => {
    if (typeof nextConfig.headers !== "function") {
      throw new Error("nextConfig.headers should be a function");
    }

    const headersConfig = await nextConfig.headers();
    const globalRule = headersConfig.find((rule) => rule.source === "/:path*");

    expect(globalRule).toBeDefined();

    const headersMap = new Map(
      globalRule?.headers.map((h) => [h.key, h.value]),
    );

    expect(headersMap.get("X-Frame-Options")).toBe("DENY");
    expect(headersMap.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headersMap.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(headersMap.get("Permissions-Policy")).toContain("camera=(self)");
    expect(headersMap.get("Permissions-Policy")).toContain("microphone=()");
  });
});
