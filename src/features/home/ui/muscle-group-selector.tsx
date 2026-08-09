import { Activity, BicepsFlexed, Dumbbell, Flame, Target } from "lucide-react";
import Link from "next/link";

import type { MuscleGroupCategoryItem } from "@/features/home/model/home-page.types";
import { NAV_FORWARD } from "@/shared/ui/transition-types";

interface MuscleGroupSelectorProps {
  categories: MuscleGroupCategoryItem[];
}

export function MuscleGroupSelector({ categories }: MuscleGroupSelectorProps) {
  return (
    <section className="muscle-selector-section">
      <div className="muscle-selector-section__header flex items-center justify-between">
        <h2>Target Muscle Groups</h2>
      </div>

      <div className="muscle-selector-grid">
        {categories.map((cat) => {
          const filterHref = cat.href || `/search?body=${encodeURIComponent(cat.id)}`;
          return (
            <Link
              key={cat.id}
              aria-label={`Explore ${cat.name} exercises`}
              className="muscle-category-card"
              href={filterHref}
              transitionTypes={NAV_FORWARD}
            >
              <div className="muscle-category-card__icon">
                {cat.icon === "biceps" && <BicepsFlexed size={20} />}
                {cat.icon === "activity" && <Activity size={20} />}
                {cat.icon === "flame" && <Flame size={20} />}
                {cat.icon === "dumbbell" && <Dumbbell size={20} />}
                {cat.icon === "target" && <Target size={20} />}
              </div>
              <strong className="muscle-category-card__title">{cat.name}</strong>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
