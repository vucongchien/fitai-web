"use client";

import { Button } from "@/shared/ui/button";
import { FeedbackState } from "@/shared/ui/feedback-state";

export default function MainErrorPage({
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
          console.error("FITAI main route error", { digest: error.digest, message: error.message });
        }
      }}
    >
      <FeedbackState
        description="This tab could not load right now. You can retry or switch to another tab."
        title="Something went wrong loading this view."
        tone="error"
      />
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
