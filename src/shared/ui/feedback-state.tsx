import { AlertTriangle, ArrowRight, RotateCcw } from "lucide-react";
import Link from "next/link";

interface FeedbackStateProps {
  actionHref?: string;
  actionLabel?: string;
  description: string;
  tone?: "empty" | "error";
  title: string;
}

export function FeedbackState({
  actionHref,
  actionLabel,
  description,
  title,
  tone = "empty",
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
      {actionHref && actionLabel ? (
        <Link className="text-action" href={actionHref}>
          {actionLabel}
          <ArrowRight aria-hidden="true" size={17} />
        </Link>
      ) : null}
    </section>
  );
}
