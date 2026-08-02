import { FeedbackState } from "@/shared/ui/feedback-state";

export default function NotFound() {
  return (
    <main className="error-page">
      <FeedbackState
        actionHref="/home"
        actionLabel="Return home"
        description="The route may have moved, or the workout is no longer available."
        title="This route is not available."
      />
    </main>
  );
}
