import type { Metadata } from "next";
import { Suspense } from "react";

import { PartnerLanding } from "@/features/partner/ui/partner-landing";
import { getAuthenticatedSession, isBrand } from "@/shared/auth/session";

export const metadata: Metadata = {
  title: "FITAI Partner Portal — Grow with the AI Fitness Community",
  description:
    "Official Brand Partner portal and onboarding application for the FITAI AI fitness ecosystem.",
};

async function PartnerLandingGate() {
  const [session, isBrandAccount] = await Promise.all([getAuthenticatedSession(), isBrand()]);

  return (
    <PartnerLanding
      isAuthenticated={Boolean(session.accessToken)}
      isBrandAccount={isBrandAccount}
      userName={session.userName}
    />
  );
}

export default function PartnerPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--color-canvas)] flex items-center justify-center text-sm text-[var(--color-text-muted)]">
          Loading FITAI Partner Portal...
        </div>
      }
    >
      <PartnerLandingGate />
    </Suspense>
  );
}
