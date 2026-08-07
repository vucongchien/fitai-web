import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  cacheComponents: true,
  allowedDevOrigins: ["127.0.0.1"],

  images: {
    /**
     * Allowlist for `next/image` remote sources — user avatars.
     *
     * The optimizer returns 400 for any host not listed here, so this must track
     * the identity providers actually enabled. `AdminUser.provider` is
     * "google" | "facebook" | "email"; the first two hand back a CDN URL.
     * `images.unsplash.com` covers the mock fixtures in
     * `features/admin/api/admin-user-service.ts` until the real API is wired.
     *
     * Adding a provider means adding its avatar host here, otherwise the picture
     * silently 400s. Both call sites fall back to the user's initial on error, so
     * a missing host degrades to the monogram rather than a broken image.
     */
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "platform-lookaside.fbsbx.com" },
      { protocol: "https", hostname: "**.fbcdn.net" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  experimental: {
    useTypeScriptCli: true,
  },

  async headers() {
    return [
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
