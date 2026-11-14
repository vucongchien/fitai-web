"use client";

import { Activity, ExternalLink } from "lucide-react";

interface ObservabilityLink {
  label: string;
  href: string;
}

const OBSERVABILITY_LINKS: ObservabilityLink[] = [
  { label: "Grafana Cloud", href: process.env.NEXT_PUBLIC_GRAFANA_URL ?? "" },
  { label: "Grafana Alloy", href: process.env.NEXT_PUBLIC_ALLOY_URL ?? "" },
].filter((item) => item.href.length > 0);

/** External links to observability dashboards configured via NEXT_PUBLIC_* env vars. */
export function AdminObservabilityLinks() {
  if (OBSERVABILITY_LINKS.length === 0) {
    return null;
  }

  return (
    <nav className="space-y-1.5">
      <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
        Observability
      </div>
      {OBSERVABILITY_LINKS.map((item) => (
        <a
          key={item.label}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center justify-between px-3.5 py-2.5 rounded-[var(--radius-input)] text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-subtle)]"
        >
          <div className="flex items-center gap-3">
            <Activity className="size-4.5 text-[var(--color-text-muted)] group-hover:text-[var(--color-text)]" />
            <span>{item.label}</span>
          </div>
          <ExternalLink className="size-3.5 opacity-0 group-hover:opacity-100 text-[var(--color-text-muted)]" />
        </a>
      ))}
    </nav>
  );
}
