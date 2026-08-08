import { AlertTriangle, ArrowRight, RotateCcw } from "lucide-react";
import Link from "next/link";

interface FeedbackStateProps {
  actionHref?: string;
  actionLabel?: string;
  description: string;
  tone?: "empty" | "error";
  title: string;
  onActionClick?: () => void;
}

export function FeedbackState({
  actionHref,
  actionLabel,
  description,
  title,
  tone = "empty",
  onActionClick,
}: FeedbackStateProps) {
  const Icon = tone === "error" ? AlertTriangle : RotateCcw;

  return (
    <section className="feedback-state" data-tone={tone}>
      <span aria-hidden="true" className="feedback-state__icon">
        <Icon size={22} />
      </span>
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {onActionClick && actionLabel ? (
        <button
          className="ui-button ui-button--secondary ui-button--medium text-action"
          onClick={onActionClick}
          type="button"
          style={{ marginTop: "1rem", display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
        >
          {actionLabel}
          <ArrowRight aria-hidden="true" size={17} />
        </button>
      ) : (actionHref && actionLabel ? (
        <Link className="text-action" href={actionHref}>
          {actionLabel}
          <ArrowRight aria-hidden="true" size={17} />
        </Link>
      ) : null)}
    </section>
  );
}
