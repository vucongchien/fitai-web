import { Suspense } from "react";

import { ProfileSettingsView } from "@/features/profile/components/profile-settings-view";
import { getProfileData } from "@/features/profile/server/get-profile-data";
import { PageTransition } from "@/shared/ui/page-transition";

export const metadata = { title: "Cài đặt | FITAI" };

async function SettingsContent() {
  const profileData = await getProfileData();
  return <ProfileSettingsView profile={profileData} />;
}

function SettingsSkeleton() {
  return (
    <div className="min-h-screen bg-white pb-20">
      <header className="h-14 border-b border-neutral-200/90 bg-white px-5 sm:px-6 flex items-center justify-between">
        <div className="w-16" />
        <div className="h-5 w-24 bg-neutral-200 animate-pulse rounded-md" />
        <div className="h-5 w-16 bg-neutral-200 animate-pulse rounded-md" />
      </header>
      <main className="max-w-[560px] mx-auto px-4 pt-5 space-y-6">
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
