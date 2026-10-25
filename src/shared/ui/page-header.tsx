"use client";

import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";
import { BackButton } from "@/shared/ui/back-button";

export interface PageHeaderProps {
  title: ReactNode;
  fallbackHref?: string;
  left?: ReactNode;
  right?: ReactNode;
  className?: string;
  backAriaLabel?: string;
}

export function PageHeader({
  title,
  fallbackHref = "/profile",
  left,
  right,
  className,
  backAriaLabel,
}: PageHeaderProps) {
  return (
    <header className={cn("focused-header", className)}>
      <div className="flex items-center justify-start min-w-0">
        {left ?? (
          <BackButton
            fallbackHref={fallbackHref}
            ariaLabel={backAriaLabel}
            className="focused-header__back"
          />
        )}
      </div>
      {typeof title === "string" ? (
        <h1 className="focused-header__title truncate max-w-full px-2">{title}</h1>
      ) : (
        title
      )}
      <div className="flex items-center justify-end min-w-0">
        {right ?? <span className="focused-header__spacer" aria-hidden="true" />}
      </div>
    </header>
  );
}
