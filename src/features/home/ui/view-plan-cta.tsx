"use client";

import { ArrowDown } from "lucide-react";

type ViewPlanCtaProps = {
  /** id of the element to reveal. */
  targetId: string;
};

export function ViewPlanCta({ targetId }: ViewPlanCtaProps) {
  function reveal() {
    const target = document.getElementById(targetId);
    if (!target) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });

    // Move reading position too, so keyboard and screen-reader users land where sighted
    // users are looking.
    target.focus({ preventScroll: true });
  }

  return (
    <button
      className="ui-button ui-button--primary ui-button--large view-plan-cta"
      onClick={reveal}
      type="button"
    >
      <span className="ui-button__label">
        View today&rsquo;s plan
        <ArrowDown aria-hidden="true" size={18} />
      </span>
    </button>
  );
}
