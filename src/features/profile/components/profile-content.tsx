"use client";

import { useState } from "react";

import type { ProfileViewModel } from "../model/profile.types";
import type { ModalType } from "./profile-details-modal";
import { ProfileDetailsModal } from "./profile-details-modal";
import { ProfileHeroCard } from "./profile-hero-card";
import { ProfileHighlightCards } from "./profile-highlight-cards";
import { ProfileMenuList } from "./profile-menu-list";

interface ProfileContentProps {
  profile: ProfileViewModel;
}

export function ProfileContent({ profile: initialProfile }: ProfileContentProps) {
  const [profile, setProfile] = useState<ProfileViewModel>(initialProfile);
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  const handleSaveProfile = (updatedFields: Partial<ProfileViewModel>) => {
    setProfile((prev) => ({
      ...prev,
      ...updatedFields,
      highlights: {
        ...prev.highlights,
        ...updatedFields.highlights,
      },
      healthMetrics: {
        ...prev.healthMetrics,
        ...updatedFields.healthMetrics,
      },
      user: {
        ...prev.user,
        ...updatedFields.user,
      },
      settings: {
        ...prev.settings,
        ...updatedFields.settings,
      },
    }));
  };

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Hero Card */}
      <section>
        <ProfileHeroCard user={profile.user} bestPr={profile.bestPr} stats={profile.stats} />
      </section>

      {/* Separator Divider */}
      <hr className="border-t border-neutral-200/80 my-4" />

      {/* 2. Highlight Cards */}
      <section>
        <ProfileHighlightCards highlights={profile.highlights} />
      </section>

      {/* Separator Divider */}
      <hr className="border-t border-neutral-200/80 my-4" />

      {/* 3. Card Menu List */}
      <section>
        <ProfileMenuList profile={profile} onOpenModal={(type) => setActiveModal(type)} />
      </section>

      {/* 4. Details Modal Container */}
      <ProfileDetailsModal
        activeModal={activeModal}
        onClose={() => setActiveModal(null)}
        profile={profile}
        onSaveProfile={handleSaveProfile}
      />
    </div>
  );
}
