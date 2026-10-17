"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

import { NAV_FORWARD } from "@/shared/ui/transition-types";

interface ProfileCompletionBannerProps {
  completionRate: number;
  missingFields?: string[];
}

export function ProfileCompletionBanner({
  completionRate,
  missingFields = [],
}: ProfileCompletionBannerProps) {
  if (completionRate >= 100) {
    return null;
  }

  const roundedRate = Math.min(100, Math.max(0, Math.round(completionRate || 0)));

  const benefitMessage =
    missingFields.length > 0
      ? "Add your physical stats so FITAI calculates your accurate workout weights and calorie needs."
      : "Calibrate your body metrics to unlock personalized training loads and nutrition targets.";

  return (
    <div className="profile-completion-banner">
      <div className="profile-completion-banner__content">
        <div className="profile-completion-banner__icon-wrap">
          <Sparkles size={18} />
        </div>

        <div className="profile-completion-banner__info">
          <div className="profile-completion-banner__header">
            <h3>Personalize Your AI Coach</h3>
            <span className="profile-completion-banner__badge">{roundedRate}% calibrated</span>
          </div>

          <p>{benefitMessage}</p>

          <div className="profile-completion-banner__progress-rail">
            <div
              className="profile-completion-banner__progress-fill"
              style={{ width: `${roundedRate}%` }}
            />
          </div>
        </div>
      </div>

      <Link
        aria-label="Personalize your health profile"
        className="profile-completion-banner__cta"
        href="/profile"
        transitionTypes={NAV_FORWARD}
      >
        <span>Personalize now</span>
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}
