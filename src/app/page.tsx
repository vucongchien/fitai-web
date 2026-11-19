import type { Metadata } from "next";
import { Suspense } from "react";

import "@/features/landing/ui/landing-page.css";
import { LANDING_FAQS } from "@/features/lab/model/landing-faqs";
import { LandingKnowledgeFooter } from "@/features/lab/ui/landing-knowledge-footer";
import { AdaptiveRoadmapSection } from "@/features/landing/ui/adaptive-roadmap-section";
import { BodyEvidenceSection } from "@/features/landing/ui/body-evidence-section";
import { CommunitySoloSection } from "@/features/landing/ui/community-solo-section";
import { LandingHeader } from "@/features/landing/ui/landing-header";
import { LandingHero } from "@/features/landing/ui/landing-hero";
import { MovementLabSection } from "@/features/landing/ui/movement-lab-section";
import { TrialConsultSection } from "@/features/landing/ui/trial-consult-section";
import { SITE_DESCRIPTION } from "@/shared/seo/site-config";
import {
  buildFaqPageJsonLd,
  buildSoftwareApplicationJsonLd,
  buildWebsiteJsonLd,
  serializeJsonLd,
} from "@/shared/seo/structured-data";

export const metadata: Metadata = {
  title: {
    absolute: "FITAI — Evidence-Based Adaptive Fitness & Form Coaching",
  },
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    url: "/",
    title: "FITAI — Evidence-Based Adaptive Fitness & Form Coaching",
    description: SITE_DESCRIPTION,
  },
};

const WEBSITE_JSON_LD = { __html: serializeJsonLd(buildWebsiteJsonLd()) };
const SOFTWARE_APP_JSON_LD = { __html: serializeJsonLd(buildSoftwareApplicationJsonLd()) };
const LANDING_FAQ_JSON_LD = { __html: serializeJsonLd(buildFaqPageJsonLd(LANDING_FAQS)) };

export default function LandingPage() {
  return (
    <div className="fl-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={WEBSITE_JSON_LD} />
      <script type="application/ld+json" dangerouslySetInnerHTML={SOFTWARE_APP_JSON_LD} />
      <script type="application/ld+json" dangerouslySetInnerHTML={LANDING_FAQ_JSON_LD} />
      <LandingHeader />
      <main id="main-content">
        <LandingHero />
        <AdaptiveRoadmapSection />
        <MovementLabSection />
        <Suspense fallback={null}>
          <CommunitySoloSection />
        </Suspense>
        <BodyEvidenceSection />
        <TrialConsultSection />
      </main>
      <LandingKnowledgeFooter />
    </div>
  );
}
