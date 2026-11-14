import type {
  BreadcrumbList,
  FAQPage,
  HowTo,
  SoftwareApplication,
  TechArticle,
  WebSite,
  WithContext,
} from "schema-dts";

import type { KnowledgeGuide } from "@/features/lab/model/guides-data";
import type { LabFaqItem } from "@/features/lab/model/lab-catalog";
import type { LabExerciseSpec } from "@/features/lab/server/load-lab-catalog";

import { getSiteUrl, SITE_DESCRIPTION, SITE_NAME } from "./site-config";

interface BreadcrumbItem {
  name: string;
  path: string;
}

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
      "Real-time biomechanical form assessment across 12 core exercises",
      "Complete manual workout logging fallback alongside camera form analysis",
      "Goal-based daily nutrition targets and meal logging",
      "Injury guard that replaces affected movements and adjusts weekly load",
      "Solo matches and community challenges",
    ],
  };
}

function buildBreadcrumbJsonLd(items: readonly BreadcrumbItem[]): WithContext<BreadcrumbList> {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: `${siteUrl}${item.path}`,
    })),
  };
}

function buildFaqPageJsonLd(faqs: readonly LabFaqItem[]): WithContext<FAQPage> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

function buildExerciseHowToJsonLd(exercise: LabExerciseSpec): WithContext<HowTo> {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `How to perform ${exercise.displayName} with biomechanical form checks`,
    description: exercise.answerSummary,
    step: exercise.phases.map((phase, idx) => ({
      "@type": "HowToStep",
      position: idx + 1,
      name: `${phase.name} (${exercise.phaseMetric} ${phase.condition})`,
      text: phase.comment || `Maintain ${exercise.phaseMetric} ${phase.condition}.`,
      url: `${siteUrl}/lab/${exercise.slug}#phase-${phase.name.toLowerCase()}`,
    })),
  };
}

function buildTechArticleJsonLd(guide: KnowledgeGuide): WithContext<TechArticle> {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: guide.title,
    description: guide.description,
    datePublished: guide.updatedAt,
    dateModified: guide.updatedAt,
    mainEntityOfPage: `${siteUrl}/guides/${guide.slug}`,
    author: {
      "@type": "Organization",
      name: SITE_NAME,
      url: siteUrl,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: siteUrl,
    },
  };
}

function serializeJsonLd(data: unknown): string {
  // Escape '<' to prevent closing </script> tags inside serialized JSON-LD.
  return JSON.stringify(data).replaceAll("<", String.raw`\u003c`);
}

export {
  buildBreadcrumbJsonLd,
  buildExerciseHowToJsonLd,
  buildFaqPageJsonLd,
  buildSoftwareApplicationJsonLd,
  buildTechArticleJsonLd,
  buildWebsiteJsonLd,
  serializeJsonLd,
};
