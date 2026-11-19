import { describe, expect, it } from "vitest";

import { detectSubdomain, resolveSubdomainRewrite } from "@/shared/routing/subdomain";

describe("detectSubdomain", () => {
  it("detects admin subdomains in production and local dev", () => {
    expect(detectSubdomain("admin.chien.id.vn")).toBe("admin");
    expect(detectSubdomain("admin.localhost:3000")).toBe("admin");
    expect(detectSubdomain("ADMIN.CHIEN.ID.VN")).toBe("admin");
  });

  it("detects partner subdomains in production and local dev", () => {
    expect(detectSubdomain("partner.chien.id.vn")).toBe("partner");
    expect(detectSubdomain("partner.localhost:3000")).toBe("partner");
  });

  it("defaults to main for apex, www, localhost, or empty host", () => {
    expect(detectSubdomain("chien.id.vn")).toBe("main");
    expect(detectSubdomain("www.chien.id.vn")).toBe("main");
    expect(detectSubdomain("localhost:3000")).toBe("main");
    expect(detectSubdomain(null)).toBe("main");
  });
});

describe("resolveSubdomainRewrite", () => {
  it("rewrites admin subdomain root and relative routes to /admin/*", () => {
    expect(resolveSubdomainRewrite("admin.chien.id.vn", "/")).toBe("/admin");
    expect(resolveSubdomainRewrite("admin.localhost:3000", "/brands")).toBe("/admin/brands");
    expect(resolveSubdomainRewrite("admin.chien.id.vn", "/exercises/123")).toBe(
      "/admin/exercises/123",
    );
  });

  it("does not double-prefix paths that already start with /admin", () => {
    expect(resolveSubdomainRewrite("admin.chien.id.vn", "/admin")).toBeNull();
    expect(resolveSubdomainRewrite("admin.chien.id.vn", "/admin/brands")).toBeNull();
  });

  it("rewrites partner subdomain root and relative routes to /partner/*", () => {
    expect(resolveSubdomainRewrite("partner.chien.id.vn", "/")).toBe("/partner");
    expect(resolveSubdomainRewrite("partner.localhost:3000", "/dashboard")).toBe(
      "/partner/dashboard",
    );
    expect(resolveSubdomainRewrite("partner.chien.id.vn", "/partner/dashboard")).toBeNull();
  });

  it("never rewrites shared passthrough routes or main domain routes", () => {
    expect(resolveSubdomainRewrite("admin.chien.id.vn", "/login")).toBeNull();
    expect(resolveSubdomainRewrite("partner.chien.id.vn", "/api/auth/session")).toBeNull();
    expect(resolveSubdomainRewrite("admin.chien.id.vn", "/_next/static/chunk.js")).toBeNull();
    expect(resolveSubdomainRewrite("partner.chien.id.vn", "/favicon.ico")).toBeNull();
    expect(resolveSubdomainRewrite("chien.id.vn", "/home")).toBeNull();
  });
});
