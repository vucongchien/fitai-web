"use client";

import { Loader2, Share2, Sparkles, X } from "lucide-react";
import { useState, useTransition } from "react";

import type { SessionReport } from "@/features/workout/model/live-session.types";
import { shareWorkoutSessionAction } from "@/features/workout/server/workout-actions";
import { Button } from "@/shared/ui/button";

interface ShareWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: SessionReport;
  onSuccess: () => void;
}

export function ShareWorkoutModal({ isOpen, onClose, report, onSuccess }: ShareWorkoutModalProps) {
  const [caption, setCaption] = useState("");
  const [visibility, setVisibility] = useState<"PUBLIC" | "FOLLOWERS_ONLY">("PUBLIC");
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const formattedVolume = new Intl.NumberFormat("en-US").format(report.totalVolumeKg);

  const handleShare = () => {
    setErrorMsg(null);
    startTransition(async () => {
      const res = await shareWorkoutSessionAction({
        sessionId: report.sessionId,
        caption: caption.trim(),
        visibility,
      });

      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMsg(res.message || "Failed to share workout to community");
      }
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-workout-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl bg-white border border-neutral-200 shadow-2xl p-6 sm:p-7 overflow-hidden text-neutral-900 transition-all scale-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600 ring-1 ring-orange-200/60">
              <Share2 size={18} />
            </div>
            <div>
              <h2 id="share-workout-title" className="text-base font-semibold leading-tight">
                Share to Community
              </h2>
              <p className="text-xs text-neutral-500">
                Post your workout achievements to the Activity Feed
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Workout Preview Card */}
        <div className="mt-4 rounded-xl border border-neutral-200/80 bg-neutral-50/70 p-4">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900 px-2.5 py-0.5 text-[10px] font-semibold tracking-wider text-white uppercase">
              Workout Summary
            </span>
            <span className="text-xs font-medium text-neutral-500">
              {report.durationMin}m session
            </span>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-white p-2 border border-neutral-100 shadow-2xs">
              <span className="text-[11px] font-medium text-neutral-400 block">Sets</span>
              <span className="text-sm font-bold text-neutral-800">{report.totalSets}</span>
            </div>
            <div className="rounded-lg bg-white p-2 border border-neutral-100 shadow-2xs">
              <span className="text-[11px] font-medium text-neutral-400 block">Volume</span>
              <span className="text-sm font-bold text-neutral-800">
                {report.totalVolumeKg > 0 ? `${formattedVolume} kg` : "Bodyweight"}
              </span>
            </div>
            <div className="rounded-lg bg-white p-2 border border-neutral-100 shadow-2xs">
              <span className="text-[11px] font-medium text-neutral-400 block">Duration</span>
              <span className="text-sm font-bold text-neutral-800">{report.durationMin}m</span>
            </div>
          </div>

          {report.personalRecords.length > 0 && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 border border-amber-200/50">
              <Sparkles size={14} className="text-amber-600 flex-shrink-0" />
              <span className="truncate">
                {report.personalRecords.length === 1
                  ? "1 New PR: "
                  : `${report.personalRecords.length} PRs: `}
                {report.personalRecords.map((pr) => `${pr.name} (${pr.oneRepMaxKg}kg)`).join(", ")}
              </span>
            </div>
          )}
        </div>

        {/* Caption Input */}
        <div className="mt-4">
          <label
            htmlFor="share-caption"
            className="block text-xs font-semibold text-neutral-700 mb-1.5"
          >
            Caption (optional)
          </label>
          <textarea
            id="share-caption"
            rows={3}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="How did this workout feel? Add notes, thoughts, or celebrate milestones..."
            maxLength={500}
            className="w-full resize-none rounded-xl border border-neutral-300 p-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-hidden transition-all shadow-2xs"
          />
          <div className="mt-1 flex justify-between text-[11px] text-neutral-400">
            <span>Visible to members in the community</span>
            <span>{caption.length}/500</span>
          </div>
        </div>

        {/* Visibility selection */}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs font-medium text-neutral-600">Audience:</span>
          <div className="inline-flex rounded-lg border border-neutral-200 p-0.5 bg-neutral-100 text-xs">
            <button
              type="button"
              onClick={() => setVisibility("PUBLIC")}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                visibility === "PUBLIC"
                  ? "bg-white text-neutral-900 shadow-2xs"
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              Public
            </button>
            <button
              type="button"
              onClick={() => setVisibility("FOLLOWERS_ONLY")}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                visibility === "FOLLOWERS_ONLY"
                  ? "bg-white text-neutral-900 shadow-2xs"
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              Followers only
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-3 rounded-lg bg-red-50 p-2.5 text-xs text-red-600 border border-red-200">
            {errorMsg}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-neutral-100">
          <Button
            type="button"
            variant="quiet"
            size="medium"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="medium"
            onClick={handleShare}
            disabled={isPending}
            className="gap-2"
          >
            {isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Sharing...
              </>
            ) : (
              <>
                <Share2 size={16} />
                Share Post
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
