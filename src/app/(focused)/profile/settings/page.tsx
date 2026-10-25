import { Suspense } from "react";

import { ProfileSettingsView } from "@/features/profile/components/profile-settings-view";
import { getProfileData } from "@/features/profile/server/get-profile-data";
import { PageTransition } from "@/shared/ui/page-transition";

export const metadata = { title: "Settings | FITAI" };

async function SettingsContent() {
  const profileData = await getProfileData();
  return <ProfileSettingsView profile={profileData} />;
}

function SettingsSkeleton() {
  return (
    <div className="min-h-screen bg-white pb-20">
      <header className="focused-header">
        <div className="focused-header__back" />
        <div className="h-6 w-24 bg-neutral-200 animate-pulse rounded-md justify-self-center" />
        <span className="focused-header__spacer" />
      </header>
      <main className="max-w-[560px] mx-auto px-4 pt-4 space-y-6">
        <div className="h-72 rounded-2xl bg-neutral-100 animate-pulse" />
        <div className="h-20 rounded-2xl bg-neutral-100 animate-pulse" />
        <div className="h-20 rounded-2xl bg-neutral-100 animate-pulse" />
        <div className="h-13 rounded-2xl bg-neutral-200 animate-pulse" />
      </main>
    </div>
  );
}

export default function ProfileSettingsPage() {
  return (
    <PageTransition>
      <Suspense fallback={<SettingsSkeleton />}>
        <SettingsContent />
      </Suspense>
    </PageTransition>
  );
}
