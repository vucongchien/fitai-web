import Link from "next/link";
import { ArrowRight } from "lucide-react";

const HERO_PILLARS = [
  "AI Workout & Meal Plans",
  "Live Form Assessment",
  "Solo Match & Community",
  "Muscle Progress Tracking",
] as const;

export function LandingHero() {
  return (
    <section className="fl-section fl-hero" aria-labelledby="hero-heading">
      <div className="fl-container">
        <div className="fl-hero-center">
          <span className="fl-kicker">FITAI COACHING</span>
          <h1 id="hero-heading" className="fl-hero-title">
            Train with evidence,
            <br />
            not guesswork.
          </h1>
          <p className="fl-hero-subtitle">
            AI-personalized workout & nutrition plans, real-time form checks, community challenges,
            and muscle-level progress tracking.
          </p>

          <div className="fl-hero-actions">
            <Link href="/login" className="fl-btn fl-btn-primary">
              Start training <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link href="/home" className="fl-btn fl-btn-secondary">
              Open Today view
            </Link>
          </div>

          <div className="fl-hero-pillars" aria-label="Core capabilities">
            {HERO_PILLARS.map((label) => (
              <span className="fl-pillar-chip" key={label}>
                <span className="fl-pillar-dot" aria-hidden="true" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
