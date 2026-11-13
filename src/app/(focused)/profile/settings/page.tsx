import { unstable_rethrow } from "next/navigation";
import { Suspense } from "react";

import { getNotificationSettingsAction } from "@/features/notification/server/notification-actions";
import { ProfileSettingsView } from "@/features/profile/components/profile-settings-view";
import { getProfileData } from "@/features/profile/server/get-profile-data";
import { PageTransition } from "@/shared/ui/page-transition";

export const metadata = { title: "Settings | FITAI" };

async function SettingsContent() {
  const [profileData, notificationSettings] = await Promise.all([
    getProfileData(),
    getNotificationSettingsAction().catch((error) => {
      unstable_rethrow(error);
      console.error("[SettingsContent] failed to load notification settings:", error);
      return null;
    }),
  ]);
  return (
    <ProfileSettingsView profile={profileData} initialNotificationSettings={notificationSettings} />
  );
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
