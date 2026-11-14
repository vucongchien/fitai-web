"use client";

import { Button } from "@/shared/ui/button";
import { FeedbackState } from "@/shared/ui/feedback-state";

export default function WorkoutErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main
      className="error-page px-5 sm:px-6 py-10"
      ref={(node) => {
        if (node) {
          console.error("FITAI workout route error", {
            digest: error.digest,
            message: error.message,
          });
        }
      }}
    >
      <FeedbackState
        description="Your workout session could not load. Your draft and account data are safe."
        title="Workout screen failed to load."
        tone="error"
      />
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
