import { PageTransition } from "@/shared/ui/page-transition";

export const metadata = { title: "Nutrition" };

export default function NutritionPage() {
  return (
    <PageTransition className="page">
      <header className="page-heading">
        <div>
          <h1>Nutrition</h1>
          <p>Today&rsquo;s meals, gently guided. Detailed layout ships in the next checkpoint.</p>
        </div>
      </header>
    </PageTransition>
  );
}
