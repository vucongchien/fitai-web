"use client";

import { Sparkles } from "lucide-react";

type AiGenerateButtonProps = {
  onRecommend: () => void;
  isLoading?: boolean;
};

export function AiGenerateButton({ onRecommend, isLoading = false }: AiGenerateButtonProps) {
  return (
    <button
      aria-label="AI Recommend custom workout"
      className="ai-recommend-button"
      disabled={isLoading}
      onClick={onRecommend}
      type="button"
    >
      <Sparkles className="ai-recommend-button__icon" size={17} />
      <span>{isLoading ? "Generating plan..." : "AI Recommend for me"}</span>
    </button>
  );
}
