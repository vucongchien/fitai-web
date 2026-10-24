import { AlertCircle, ArrowRight, RefreshCw } from "lucide-react";
import Link from "next/link";

import { Button } from "@/shared/ui/button";

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
  const Icon = tone === "error" ? AlertCircle : RefreshCw;

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
        <Button className="text-action" onClick={onActionClick} type="button" variant="secondary">
          {actionLabel}
          <ArrowRight aria-hidden="true" size={17} />
        </Button>
      ) : actionHref && actionLabel ? (
        <Link className="text-action" href={actionHref}>
          {actionLabel}
          <ArrowRight aria-hidden="true" size={17} />
        </Link>
      ) : null}
    </section>
  );
}
