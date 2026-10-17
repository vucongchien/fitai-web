"use client";

import {
  AlertCircle,
  ChevronRight,
  Dumbbell,
  HelpCircle,
  LogOut,
  Scale,
  Target,
  User,
} from "lucide-react";
import { useState } from "react";

import type { ProfileViewModel } from "../model/profile.types";

export type ModalType =
  | "BODY_METRICS"
  | "GOALS"
  | "EQUIPMENT"
  | "PERSONAL_INFO"
  | "INJURY_HISTORY"
  | "FEEDBACK"
  | null;

interface ProfileMenuListProps {
  profile: ProfileViewModel;
  onOpenModal: (type: ModalType) => void;
}

export function ProfileMenuList({ profile, onOpenModal }: ProfileMenuListProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const activeInjuries = profile.injuries.filter((i) => !i.isRecovered);

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }
    setIsLoggingOut(true);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });
      if (response.ok) {
        window.location.href = "/login";
      } else {
        console.error("Failed to log out");
        setIsLoggingOut(false);
      }
    } catch (error) {
      console.error("Error during logout:", error);
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="w-full space-y-1 text-left">
      {/* 1. Body Metrics */}
      <div className="pb-3 border-b border-[var(--color-border)]">
        <button
          onClick={() => onOpenModal("BODY_METRICS")}
          className="group flex min-h-[52px] w-full items-center justify-between py-2 px-1 text-left transition-colors hover:bg-[var(--color-surface-subtle)] rounded-[var(--radius-surface)]"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-input)] bg-[var(--color-action-soft)] text-[var(--color-action)]">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[var(--color-text)] group-hover:text-[var(--color-action)] transition-colors">
                Body Metrics
              </div>
              <div className="text-xs text-[var(--color-text-muted)]">
                BMI: <span className="data-value font-semibold">{profile.healthMetrics.bmi}</span> •{" "}
                {profile.highlights.currentWeightKg}kg ({profile.healthMetrics.bmiCategory})
              </div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-[var(--color-text-muted)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--color-action)]" />
        </button>
      </div>

      {/* 2. Training Goals (Dedicated) */}
      <div className="py-3 border-b border-[var(--color-border)]">
        <button
          onClick={() => onOpenModal("GOALS")}
          className="group flex min-h-[52px] w-full items-center justify-between py-2 px-1 text-left transition-colors hover:bg-[var(--color-surface-subtle)] rounded-[var(--radius-surface)]"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-input)] bg-[var(--color-action-soft)] text-[var(--color-action)]">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[var(--color-text)] group-hover:text-[var(--color-action)] transition-colors">
                Training Goals
              </div>
              <div className="text-xs text-[var(--color-text-muted)]">
                {profile.healthMetrics.goals.join(", ")} • {profile.user.experienceLevel}
              </div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-[var(--color-text-muted)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--color-action)]" />
        </button>
      </div>

      {/* 3. Available Equipment (Dedicated) */}
      <div className="py-3 border-b border-[var(--color-border)]">
        <button
          onClick={() => onOpenModal("EQUIPMENT")}
          className="group flex min-h-[52px] w-full items-center justify-between py-2 px-1 text-left transition-colors hover:bg-[var(--color-surface-subtle)] rounded-[var(--radius-surface)]"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-input)] bg-[var(--color-action-soft)] text-[var(--color-action)]">
              <Dumbbell className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[var(--color-text)] group-hover:text-[var(--color-action)] transition-colors">
                Available Equipment
              </div>
              <div className="text-xs text-[var(--color-text-muted)]">
                {profile.settings.availableEquipment.join(", ")}
              </div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-[var(--color-text-muted)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--color-action)]" />
        </button>
      </div>

      {/* 4. Personal Info */}
      <div className="py-3 border-b border-[var(--color-border)]">
        <button
          onClick={() => onOpenModal("PERSONAL_INFO")}
          className="group flex min-h-[52px] w-full items-center justify-between py-2 px-1 text-left transition-colors hover:bg-[var(--color-surface-subtle)] rounded-[var(--radius-surface)]"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-input)] bg-[var(--color-action-soft)] text-[var(--color-action)]">
              <User className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[var(--color-text)] group-hover:text-[var(--color-action)] transition-colors">
                Personal Info
              </div>
              <div className="text-xs text-[var(--color-text-muted)]">
                {profile.user.gender} • {profile.settings.coachStyle} Coach
              </div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-[var(--color-text-muted)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--color-action)]" />
        </button>
      </div>

      {/* 5. Injury Management */}
      <div className="py-3 border-b border-[var(--color-border)]">
        <button
          onClick={() => onOpenModal("INJURY_HISTORY")}
          className="group flex min-h-[52px] w-full items-center justify-between py-2 px-1 text-left transition-colors hover:bg-[var(--color-surface-subtle)] rounded-[var(--radius-surface)]"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-input)] bg-[var(--color-danger-soft)] text-[var(--color-danger)]">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[var(--color-text)] group-hover:text-[var(--color-action)] transition-colors">
                Injury Management
              </div>
              <div className="text-xs text-[var(--color-text-muted)]">
                {activeInjuries.length > 0
                  ? `${activeInjuries.length} active injuries reported`
                  : "No active injuries (All clear)"}
              </div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-[var(--color-text-muted)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--color-action)]" />
        </button>
      </div>

      {/* 6. Send Feedback */}
      <div className="py-3 border-b border-[var(--color-border)]">
        <button
          onClick={() => onOpenModal("FEEDBACK")}
          className="group flex min-h-[52px] w-full items-center justify-between py-2 px-1 text-left transition-colors hover:bg-[var(--color-surface-subtle)] rounded-[var(--radius-surface)]"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-input)] bg-[var(--color-action-soft)] text-[var(--color-action)]">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[var(--color-text)] group-hover:text-[var(--color-action)] transition-colors">
                Send Feedback
              </div>
              <div className="text-xs text-[var(--color-text-muted)]">Help us improve FITAI</div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-[var(--color-text-muted)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--color-action)]" />
        </button>
      </div>

      {/* 7. Log Out */}
      <div className="pt-3">
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="group flex min-h-[52px] w-full items-center justify-between py-2 px-1 text-left transition-colors text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)] rounded-[var(--radius-surface)] disabled:opacity-50"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-input)] bg-[var(--color-danger-soft)] text-[var(--color-danger)]">
              <LogOut className="h-5 w-5" />
            </div>
            <div className="text-sm font-semibold">
              {isLoggingOut ? "Logging out..." : "Log Out"}
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
