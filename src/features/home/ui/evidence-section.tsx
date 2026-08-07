import { Dumbbell, Flame, ShieldCheck, Zap } from "lucide-react";

import type { EvidenceItem } from "@/features/home/model/home-page.types";

interface EvidenceSectionProps {
  items: EvidenceItem[];
}

const iconMap = {
  dumbbell: Dumbbell,
  "shield-check": ShieldCheck,
  flame: Flame,
  zap: Zap,
} as const;

export function EvidenceSection({ items }: EvidenceSectionProps) {
  if (items.length === 0) {return null;}

  return (
    <section className="content-section evidence-list">
      <div className="content-section__header">
        <h2>Recent evidence</h2>
      </div>
      {items.map((item) => {
        const Icon = iconMap[item.icon] ?? Dumbbell;
        return (
          <div className="evidence-list__item" key={item.id}>
            <Icon aria-hidden="true" size={20} />
            <div>
              <strong className="data-value">{item.value}</strong>
              <span>{item.label}</span>
            </div>
          </div>
        );
      })}
    </section>
  );
}
