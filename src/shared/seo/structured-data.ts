import type { SoftwareApplication, WebSite, WithContext } from "schema-dts";

import { getSiteUrl, SITE_DESCRIPTION, SITE_NAME } from "./site-config";

function buildWebsiteJsonLd(): WithContext<WebSite> {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: siteUrl,
    description: SITE_DESCRIPTION,
    inLanguage: "en",
  };
}

function buildSoftwareApplicationJsonLd(): WithContext<SoftwareApplication> {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    url: siteUrl,
    applicationCategory: "HealthApplication",
    operatingSystem: "Web",
    description: SITE_DESCRIPTION,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "Four-week adaptive training roadmap (up to 6 sessions per week)",
      "Real-time biomechanical form assessment for squat, push-up, and plank",
      "Complete manual workout logging fallback alongside camera form analysis",
      "Goal-based daily nutrition targets and meal logging",
      "Injury guard that replaces affected movements and adjusts weekly load",
      "Solo matches and community challenges",
    ],
  };
}

function serializeJsonLd(data: unknown): string {
  // Escape '<' to prevent closing </script> tags inside serialized JSON-LD.
  return JSON.stringify(data).replaceAll("<", String.raw`\u003c`);
}

export { buildSoftwareApplicationJsonLd, buildWebsiteJsonLd, serializeJsonLd };
