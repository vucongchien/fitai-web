import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { BrandMark } from "@/shared/ui/brand-mark";

export function LandingClosingCta() {
  return (
    <footer className="fl-footer">
      <div className="fl-container fl-closing-inner">
        <div className="fl-closing-copy">
          <h2 className="fl-h2">Understand your body. Own every rep.</h2>
          <div className="fl-hero-actions">
            <Link className="fl-btn fl-btn-primary" href="/login">
              Start your 4-week plan <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link className="fl-btn fl-btn-secondary" href="/home">
              Open Today view
            </Link>
          </div>
        </div>

        <div className="fl-footer-meta">
          <BrandMark />
          <p className="fl-disclaimer">
            FitAI provides AI-assisted training guidance, not medical diagnosis.
          </p>
        </div>
      </div>
    </footer>
  );
}
