import type { Metadata } from "next";
import { Suspense } from "react";

import { PartnerLanding } from "@/features/partner/ui/partner-landing";
import { getAuthenticatedSession, isBrand } from "@/shared/auth/session";

export const metadata: Metadata = {
  title: "FITAI Partner Portal — Đồng hành cùng cộng đồng tập luyện AI",
  description:
    "Cổng thông tin và đăng ký đối tác thương hiệu (Brand Partner) trên nền tảng tập luyện AI FITAI.",
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
          Đang tải FITAI Partner Portal...
        </div>
      }
    >
      <PartnerLandingGate />
    </Suspense>
  );
}
