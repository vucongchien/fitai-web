import { ProfileForm } from "@/features/profile/ui/profile-form";
import { PageTransition } from "@/shared/ui/page-transition";

export const metadata = { title: "Profile" };

export default function ProfilePage() {
  return (
    <PageTransition className="page profile-page">
      <header className="profile-identity">
        <div className="profile-avatar" aria-hidden="true">
          AL
        </div>
        <div>
          <h1>Alex Lee</h1>
          <p>Building consistency · Week 2 of 4</p>
        </div>
      </header>
      <ProfileForm />
    </PageTransition>
  );
}
