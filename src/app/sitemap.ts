import type { MetadataRoute } from "next";

import { KNOWLEDGE_GUIDES } from "@/features/lab/model/guides-data";
import { LAB_EXERCISES_META } from "@/features/lab/model/lab-catalog";
import { getSiteUrl } from "@/shared/seo/site-config";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const lastModified = new Date();

  const labEntries: MetadataRoute.Sitemap = LAB_EXERCISES_META.map((item) => ({
    url: `${siteUrl}/lab/${item.slug}`,
    lastModified,
    changeFrequency: "weekly",
    priority: 0.85,
  }));

  const guideEntries: MetadataRoute.Sitemap = KNOWLEDGE_GUIDES.map((guide) => ({
    url: `${siteUrl}/guides/${guide.slug}`,
    lastModified,
    changeFrequency: "weekly",
    priority: 0.85,
  }));

  return [
    {
      url: `${siteUrl}/`,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/lab`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/guides`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...labEntries,
    ...guideEntries,
    {
      url: `${siteUrl}/login`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];
}
