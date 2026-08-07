"use client";

import { Plus, Sparkles } from "lucide-react";

interface AdhocToolsRowProps {
  aiLoading: boolean;
  onOpenSearch: () => void;
  onAiRecommend: () => void;
}

export function AdhocToolsRow({ aiLoading, onOpenSearch, onAiRecommend }: AdhocToolsRowProps) {
  return (
    <div className="adhoc-tools-row">
      <button
        aria-label="Add movement"
        className="ui-button ui-button--secondary ui-button--medium"
        onClick={onOpenSearch}
        type="button"
      >
        <Plus size={16} />
        Add movement
      </button>

      <button
        aria-label="AI Recommend custom workout"
        className="ai-recommend-button"
        disabled={aiLoading}
        onClick={onAiRecommend}
        type="button"
      >
        <Sparkles size={16} />
        <span>{aiLoading ? "Generating..." : "AI Recommend"}</span>
      </button>
    </div>
  );
}
