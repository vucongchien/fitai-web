import { PlanningSequence } from "@/features/planning/ui/planning-sequence";
import { BrandMark } from "@/shared/ui/brand-mark";
import { PageTransition } from "@/shared/ui/page-transition";

export const metadata = { title: "Building your plan" };

export default function PlanningPage() {
  return (
    <PageTransition className="planning-page">
      <header className="setup-header">
        <BrandMark href="/login" />
        <span>Four-week roadmap</span>
      </header>
      <main className="planning-main">
        <PlanningSequence />
      </main>
    </PageTransition>
  );
}
