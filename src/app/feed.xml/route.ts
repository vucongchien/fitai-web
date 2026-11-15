import { LAB_GLOSSARY_TERMS } from "@/features/lab/model/glossary-data";
import { KNOWLEDGE_GUIDES } from "@/features/lab/model/guides-data";
import { LAB_EXERCISES_META } from "@/features/lab/model/lab-catalog";
import { getSiteUrl, SITE_DESCRIPTION, SITE_NAME } from "@/shared/seo/site-config";

function escapeXml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function GET() {
  const siteUrl = getSiteUrl();
  const guideItems = KNOWLEDGE_GUIDES.map((guide) => {
    const link = `${siteUrl}/guides/${guide.slug}`;
    const pubDate = new Date(`${guide.updatedAt}T00:00:00Z`).toUTCString();
    return [
      "<item>",
      `<title>${escapeXml(guide.title)}</title>`,
      `<link>${escapeXml(link)}</link>`,
      `<guid isPermaLink="true">${escapeXml(link)}</guid>`,
      `<pubDate>${escapeXml(pubDate)}</pubDate>`,
      `<description>${escapeXml(guide.description)}</description>`,
      "</item>",
    ].join("");
  });

  const glossaryLink = `${siteUrl}/lab/glossary`;
  const glossaryItem = [
    "<item>",
    `<title>${escapeXml("FITAI Open Biomechanics & Pose AI Glossary")}</title>`,
    `<link>${escapeXml(glossaryLink)}</link>`,
    `<guid isPermaLink="true">${escapeXml(glossaryLink)}</guid>`,
    `<pubDate>${escapeXml(new Date("2026-11-15T00:00:00Z").toUTCString())}</pubDate>`,
    `<description>${escapeXml(`${LAB_GLOSSARY_TERMS.length} canonical definitions covering the 3-phase rep referee, One-Euro Filter, Epley 1RM, and safety guardrails.`)}</description>`,
    "</item>",
  ].join("");

  const exerciseItems = LAB_EXERCISES_META.map((item) => {
    const link = `${siteUrl}/lab/${item.slug}`;
    const title = `${item.slug.replaceAll("-", " ")} biomechanical form rules`;
    return [
      "<item>",
      `<title>${escapeXml(title)}</title>`,
      `<link>${escapeXml(link)}</link>`,
      `<guid isPermaLink="true">${escapeXml(link)}</guid>`,
      `<pubDate>${escapeXml(new Date("2026-11-14T00:00:00Z").toUTCString())}</pubDate>`,
      `<description>${escapeXml(item.answerSummary)}</description>`,
      "</item>",
    ].join("");
  });

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "<channel>",
    `<title>${escapeXml(`${SITE_NAME} — Open Movement Lab & Training Guides`)}</title>`,
    `<link>${escapeXml(siteUrl)}</link>`,
    `<description>${escapeXml(SITE_DESCRIPTION)}</description>`,
    "<language>en-us</language>",
    `<atom:link href="${escapeXml(`${siteUrl}/feed.xml`)}" rel="self" type="application/rss+xml" />`,
    ...guideItems,
    glossaryItem,
    ...exerciseItems,
    "</channel>",
    "</rss>",
  ].join("");

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

export { GET };
