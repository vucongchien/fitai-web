import { Suspense } from "react";

import { ProfileContent } from "@/features/profile/components/profile-content";
import { ProfileSkeleton } from "@/features/profile/components/profile-skeleton";
import { getProfileData } from "@/features/profile/server/get-profile-data";
import { PageTransition } from "@/shared/ui/page-transition";

export const metadata = { title: "Profile | FITAI" };

async function ProfileSection() {
  const profileData = await getProfileData();
  return <ProfileContent profile={profileData} />;
}

export default function ProfilePage() {
  return (
    <PageTransition className="page profile-page">
      <header className="page-heading">
        <div>
          <h1>Profile</h1>
          <p>Personal details, body metrics, training records, and account settings.</p>
        </div>
      </header>

      <Suspense fallback={<ProfileSkeleton />}>
        <ProfileSection />
      </Suspense>
    </PageTransition>
  );
}
