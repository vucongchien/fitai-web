"use client";

import { CheckCircle2, ShieldAlert, Sparkles, X } from "lucide-react";

import type { AIAdjustmentContext } from "@/features/roadmap/model/ai-adjustment-store";

interface AIChangesModalProps {
  isOpen: boolean;
  onClose: () => void;
  context: AIAdjustmentContext | null;
}

export function AIChangesModal({ isOpen, onClose, context }: AIChangesModalProps) {
  if (!isOpen || !context) {
    return null;
  }

  const getTitle = () => {
    switch (context.reason) {
      case "injury_reported":
        return "Injury Protection Protocol Applied";
      case "injury_recovered":
        return "Post-Injury Recovery Mode Activated";
      case "profile_updated":
        return "Roadmap Recalibrated for New Goals";
      default:
        return "AI Roadmap Recalibration Summary";
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-5 border border-neutral-200 relative">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 pr-8">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#101214] font-display">{getTitle()}</h3>
            <p className="text-xs text-[#50565C]">Automated coaching adaptation details</p>
          </div>
        </div>

        <div className="space-y-3">
          {context.muscleGroup && (
            <div className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-100 flex items-center gap-3">
              <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-rose-950">Target Area: </span>
                <span className="text-rose-800 font-semibold">{context.muscleGroup}</span>
                <p className="text-rose-700 mt-0.5">
                  Direct overload exercises targeting this muscle group are actively excluded or protected.
                </p>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-neutral-200 divide-y divide-neutral-100 text-xs">
            <div className="p-3.5 flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-neutral-900">Medical Safety Rule (BR-AC-09):</strong>
                <p className="text-neutral-600 mt-0.5">
                  Upcoming session plans have been revised to eliminate joint strain and prevent aggravation.
                </p>
              </div>
            </div>

            <div className="p-3.5 flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-neutral-900">History Preservation (Rule D3):</strong>
                <p className="text-neutral-600 mt-0.5">
                  100% of your completed workout sessions in the past remain untouched and preserved.
                </p>
              </div>
            </div>

            <div className="p-3.5 flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-neutral-900">Dynamic Volume & RPE Re-indexing:</strong>
                <p className="text-neutral-600 mt-0.5">
                  Effort targets (RPE) across the remaining weeks have been recalculated for optimal recovery.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold rounded-xl bg-[#4B57F2] hover:bg-[#3945DC] text-white transition-colors cursor-pointer"
          >
            Understood & Close
          </button>
        </div>
      </div>
    </div>
  );
}
