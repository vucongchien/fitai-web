"use client";

import { useEffect } from "react";

import { Button } from "@/shared/ui/button";
import { FeedbackState } from "@/shared/ui/feedback-state";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("FITAI route error", { digest: error.digest, message: error.message });
  }, [error]);

  return (
    <main className="error-page">
      <FeedbackState
        description="The current screen could not load. Your workout draft and account data have not been changed."
        title="This route did not finish loading."
        tone="error"
      />
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
