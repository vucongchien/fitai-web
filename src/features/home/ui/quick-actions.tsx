import { Dumbbell, Scale, Utensils } from "lucide-react";
import Link from "next/link";

export function QuickActions() {
  return (
    <div className="quick-actions-bar">
      <Link className="quick-action-pill" href="/workout/adhoc">
        <Dumbbell aria-hidden="true" size={15} />
        <span>+ Extra workout</span>
      </Link>

      <Link className="quick-action-pill" href="/progress/weight">
        <Scale aria-hidden="true" size={15} />
        <span>+ Log weight</span>
      </Link>

      <Link className="quick-action-pill" href="/nutrition/log">
        <Utensils aria-hidden="true" size={15} />
        <span>+ Log meal</span>
      </Link>
    </div>
  );
}
