import type { MetadataRoute } from "next";

import { getSiteUrl, PRIVATE_ROUTE_PREFIXES } from "@/shared/seo/site-config";

const AI_AND_SEARCH_BOTS = [
  "*",
  "Googlebot",
  "Bingbot",
  "Applebot",
  "Google-Extended",
  "OAI-SearchBot",
  "ChatGPT-User",
  "GPTBot",
  "PerplexityBot",
  "Claude-SearchBot",
  "ClaudeBot",
] as const;

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();
  const disallow = [...PRIVATE_ROUTE_PREFIXES];

  return {
    rules: AI_AND_SEARCH_BOTS.map((userAgent) => ({
      userAgent,
      allow: ["/", "/lab", "/guides", "/login", "/llms.txt", "/llms-full.txt", "/opengraph-image"],
      disallow,
    })),
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
