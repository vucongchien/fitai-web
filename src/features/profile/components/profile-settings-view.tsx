"use client";

import { useState } from "react";

import { PageHeader } from "@/shared/ui/page-header";

import type { ProfileViewModel } from "../model/profile.types";
import type { ModalType } from "./profile-details-modal";
import { ProfileDetailsModal } from "./profile-details-modal";
import { SettingsRow } from "./settings-row";

interface ProfileSettingsViewProps {
  profile: ProfileViewModel;
  onSaveProfile?: (updated: Partial<ProfileViewModel>) => void;
}

export function ProfileSettingsView({
  profile: initialProfile,
  onSaveProfile,
}: ProfileSettingsViewProps) {
  const [profile, setProfile] = useState<ProfileViewModel>(initialProfile);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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

  const handleSave = (updated: Partial<ProfileViewModel>) => {
    setProfile((prev) => ({
      ...prev,
      ...updated,
      user: {
        ...prev.user,
        ...updated.user,
      },
      settings: {
        ...prev.settings,
        ...updated.settings,
      },
      injuries: updated.injuries === undefined ? prev.injuries : updated.injuries,
    }));
    onSaveProfile?.(updated);
  };

  const activeInjuriesCount = profile.injuries.filter((i) => !i.isRecovered).length;

  return (
    <div className="min-h-screen bg-white pb-20">
      <PageHeader title="Settings" fallbackHref="/profile" />

      {/* Main Settings Container */}
      <main className="max-w-[560px] mx-auto px-4 pt-4 space-y-6">
        {/* Group 1: Training & Health Profile */}
        <section className="space-y-2">
          <h2 className="text-[15px] font-bold text-neutral-500 px-1 tracking-tight">
            Training & Health Profile
          </h2>
          <div className="rounded-2xl border border-neutral-200/90 bg-white shadow-2xs divide-y divide-neutral-200/80 overflow-hidden">
            <SettingsRow
              label="Personal Info"
              value={`${profile.user.gender || "Not specified"} • ${profile.settings.coachStyle || "Scientific"} Coach`}
              onClick={() => setActiveModal("PERSONAL_INFO")}
            />
            <SettingsRow
              label="Body Metrics"
              value={`${profile.highlights.currentWeightKg || 0} kg • ${profile.healthMetrics.heightCm || 0} cm • BMI ${profile.healthMetrics.bmi || 0}`}
              onClick={() => setActiveModal("BODY_METRICS")}
            />
            <SettingsRow
              label="Training Goals"
              value={`${profile.healthMetrics.goals.join(", ") || "General Fitness"} • ${profile.user.experienceLevel}`}
              onClick={() => setActiveModal("GOALS")}
            />
            <SettingsRow
              label="Available Equipment"
              value={profile.settings.availableEquipment.join(", ") || "Full Gym"}
              onClick={() => setActiveModal("EQUIPMENT")}
            />
            <SettingsRow
              label="Injury Management"
              value={
                activeInjuriesCount > 0
                  ? `${activeInjuriesCount} active injuries reported`
                  : "All clear (No active injuries)"
              }
              onClick={() => setActiveModal("INJURY_HISTORY")}
            />
          </div>
        </section>

        {/* Group 2: Preferences & Membership */}
        <section className="space-y-2">
          <h2 className="text-[15px] font-bold text-neutral-500 px-1 tracking-tight">
            Preferences & Membership
          </h2>
          <div className="rounded-2xl border border-neutral-200/90 bg-white shadow-2xs divide-y divide-neutral-200/80 overflow-hidden">
            <SettingsRow
              label="Notifications"
              value="System alerts & workout reminders"
              href="/notifications"
            />
            <SettingsRow
              label="Membership Plan"
              value="Choose or upgrade your plan"
              href="/pricing"
            />
          </div>
        </section>

        {/* Group 3: Support & Feedback */}
        <section className="space-y-2">
          <h2 className="text-[15px] font-bold text-neutral-500 px-1 tracking-tight">Support</h2>
          <div className="rounded-2xl border border-neutral-200/90 bg-white shadow-2xs divide-y divide-neutral-200/80 overflow-hidden">
            <SettingsRow
              label="Send Feedback & Help"
              value="Report bugs or suggest improvements"
              onClick={() => setActiveModal("FEEDBACK")}
            />
          </div>
        </section>

        {/* Logout Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full h-12 rounded-2xl !border-2 !border-solid !border-neutral-200 bg-neutral-100/60 text-[15px] font-bold text-sky-500 hover:bg-neutral-100 hover:text-sky-600 active:scale-98 transition-all shadow-none cursor-pointer flex items-center justify-center uppercase tracking-wider disabled:opacity-50"
          >
            {isLoggingOut ? "Logging out..." : "LOG OUT"}
          </button>
        </div>
      </main>

      {/* Modal dialogs */}
      {activeModal && (
        <ProfileDetailsModal
          activeModal={activeModal}
          profile={profile}
          onClose={() => setActiveModal(null)}
          onSaveProfile={handleSave}
        />
      )}
    </div>
  );
}
