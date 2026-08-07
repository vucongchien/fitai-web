import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <output className="empty-state">
      {Icon ? (
        <span className="empty-state__icon" aria-hidden="true">
          <Icon size={22} />
        </span>
      ) : null}
      <div className="empty-state__body">
        <h3>{title}</h3>
        {description ? <p>{description}</p> : null}
      </div>
      {action ? <div className="empty-state__action">{action}</div> : null}
    </output>
  );
}
