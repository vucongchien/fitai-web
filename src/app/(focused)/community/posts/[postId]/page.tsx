import { ThreadDetailShell } from "@/features/social/ui/thread-detail-shell";
import { PageTransition } from "@/shared/ui/page-transition";

export const instant = false;
export const metadata = { title: "Thread — FITAI" };

export default function ThreadPage() {
  return (
    <PageTransition className="min-h-screen bg-white sm:bg-neutral-50/50 px-0 sm:px-4 pt-3 pb-6">
      <ThreadDetailShell />
    </PageTransition>
  );
}
