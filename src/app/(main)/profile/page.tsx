import { getMockProgressStats } from "@/features/progress/model/progress-aggregator";
import { ProfileForm } from "@/features/profile/ui/profile-form";
import { ProgressBentoGrid } from "@/features/progress/ui/progress-bento-grid";
import { PageTransition } from "@/shared/ui/page-transition";

export const metadata = { title: "Profile" };

export default function ProfilePage() {
  const stats = getMockProgressStats();

  return (
    <PageTransition className="page profile-page space-y-4">
      <header className="profile-identity">
        <div aria-hidden="true" className="profile-avatar">
          AL
        </div>
        <div>
          <h1>Alex Lee</h1>
          <p>Building consistency · Week 2 of 4</p>
        </div>
      </header>

      <ProgressBentoGrid stats={stats} />

      <ProfileForm />
    </PageTransition>
  );
}

