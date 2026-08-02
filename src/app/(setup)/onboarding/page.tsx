import { OnboardingFlow } from "@/features/onboarding/ui/onboarding-flow";
import { BrandMark } from "@/shared/ui/brand-mark";
import { PageTransition } from "@/shared/ui/page-transition";

export const metadata = { title: "Set up your plan" };

export default function OnboardingPage() {
  return (
    <PageTransition className="setup-page">
      <header className="setup-header">
        <BrandMark href="/login" />
        <span>Your inputs stay editable</span>
      </header>
      <main className="setup-main">
        <OnboardingFlow />
      </main>
    </PageTransition>
  );
}
