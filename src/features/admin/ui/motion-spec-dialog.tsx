"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles, X } from "lucide-react";

import { fetchMotionSpecificationByExerciseId } from "@/features/admin/api/admin-motion-spec-service";
import { MotionSpecEditor } from "@/features/admin/ui/motion-spec-editor";

export interface MotionSpecDialogProps {
  isOpen: boolean;
  exerciseId: string | null;
  exerciseName?: string;
  onClose: () => void;
}

export function MotionSpecDialog({
  isOpen,
  exerciseId,
  exerciseName,
  onClose,
}: MotionSpecDialogProps) {
  const queryClient = useQueryClient();

  const { data: spec, isLoading } = useQuery({
    queryKey: ["admin-motion-spec-detail", exerciseId],
    queryFn: async () => {
      if (!exerciseId) return null;
      const data = await fetchMotionSpecificationByExerciseId(exerciseId);
      if (data && exerciseName && !data.exerciseName) {
        data.exerciseName = exerciseName;
      }
      return data;
    },
    enabled: Boolean(isOpen && exerciseId),
  });

  if (!isOpen || !exerciseId) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-5xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-600/20">
              <Sparkles className="size-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base font-display">
                Update AI Rules & Voice Files
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Exercise:{" "}
                <span className="font-bold text-indigo-600">
                  {exerciseName && exerciseName !== exerciseId ? exerciseName : "No data"}
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
          {isLoading ? (
            <div className="py-16 text-center text-xs font-semibold text-slate-500 space-y-2">
              <Sparkles className="size-8 animate-spin text-indigo-600 mx-auto" />
              <p>Loading AI Motion Specification & Rule/Voice files...</p>
            </div>
          ) : spec ? (
            <MotionSpecEditor
              spec={spec}
              onSaveSuccess={() => {
                void queryClient.invalidateQueries({
                  queryKey: ["admin-motion-spec-detail", exerciseId],
                });
                void queryClient.invalidateQueries({ queryKey: ["admin-motion-specs"] });
                void queryClient.invalidateQueries({ queryKey: ["admin-motion-spec-stats"] });
                onClose();
              }}
            />
          ) : (
            <div className="py-12 text-center text-xs text-slate-500">
              Failed to load Motion Specification configuration data.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
