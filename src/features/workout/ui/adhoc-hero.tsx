import { TripleLane } from "@/shared/ui/triple-lane";

export function AdhocHero() {
  return (
    <section className="workout-prep-hero">
      <TripleLane active="move" morph />
      <p className="utility-label">Adhoc Session · Custom Workout</p>
      <h1>Custom Workout Plan</h1>
      <p>Build capacity and strength with movements selected for today.</p>
    </section>
  );
}
