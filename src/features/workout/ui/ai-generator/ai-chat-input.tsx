"use client";

import { ArrowUp, Check, ChevronDown } from "lucide-react";
import { useState } from "react";

import {
  DURATION_OPTIONS,
  WORKOUT_PRESETS,
  type WorkoutPreset,
} from "@/features/workout/ui/ai-generator/ai-generator-presets";
import { cn } from "@/shared/lib/cn";

interface AiChatInputProps {
  selectedPresetId: string | null;
  promptText: string;
  selectedEquipment: string;
  durationMinutes: number;
  isLoading: boolean;
  showTemplates: boolean;
  onSelectPreset: (preset: WorkoutPreset) => void;
  onPromptChange: (value: string) => void;
  onEquipmentChange: (equipment: string) => void;
  onDurationChange: (minutes: number) => void;
  onSend: () => void;
}

const EQUIPMENT_MODES = [
  { id: "any", label: "Full Gym" },
  { id: "dumbbells", label: "Dumbbells" },
  { id: "bodyweight", label: "Bodyweight" },
] as const;

export function AiChatInput({
  selectedPresetId,
  promptText,
  selectedEquipment,
  durationMinutes,
  isLoading,
  showTemplates,
  onSelectPreset,
  onPromptChange,
  onEquipmentChange,
  onDurationChange,
  onSend,
}: AiChatInputProps) {
  const [openMenu, setOpenMenu] = useState<"duration" | "equipment" | null>(null);

  const activeEquipmentLabel =
    EQUIPMENT_MODES.find((m) => m.id === selectedEquipment)?.label ?? "Full Gym";

  return (
    <div className="space-y-2">
      {showTemplates && (
        <div className="flex flex-wrap items-center justify-start gap-1.5">
          {WORKOUT_PRESETS.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <button
                aria-pressed={isSelected}
                className={cn(
                  "rounded-full border! px-2.5 py-0.5 text-xs! leading-4! font-medium! transition-colors cursor-pointer",
                  isSelected
                    ? "border-[var(--color-action)]! bg-[var(--color-action-soft)] text-[var(--color-action)]"
                    : "border-[var(--color-border)]! bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-text)]",
                )}
                disabled={isLoading}
                key={preset.id}
                onClick={() => onSelectPreset(preset)}
                type="button"
              >
                {preset.title}
              </button>
            );
          })}
        </div>
      )}

      <div className="rounded-2xl bg-[var(--color-surface-subtle)] px-3.5 pt-3 pb-2.5 transition-all focus-within:ring-2 focus-within:ring-[var(--color-action-soft)]">
        <textarea
          className="block w-full resize-none bg-transparent text-sm leading-relaxed text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]/70 outline-none!"
          disabled={isLoading}
          id="ai-prompt-input"
          onChange={(e) => onPromptChange(e.target.value)}
          onFocus={() => setOpenMenu(null)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !isLoading) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder="Ask AI Coach to build or adjust your workout..."
          rows={2}
          value={promptText}
        />

        <div className="flex items-center justify-end gap-1.5 pt-2">
          <div className="relative">
            <button
              aria-expanded={openMenu === "duration"}
              aria-haspopup="listbox"
              className="inline-flex h-7 items-center gap-1 rounded-full bg-[var(--color-surface)] px-2.5 text-xs! leading-4! font-medium! text-[var(--color-text)] shadow-xs transition-colors hover:opacity-90 cursor-pointer"
              disabled={isLoading}
              onClick={() => setOpenMenu((cur) => (cur === "duration" ? null : "duration"))}
              type="button"
            >
              <span>{durationMinutes} min</span>
              <ChevronDown
                size={12}
                className="text-[var(--color-text-muted)]"
                aria-hidden="true"
              />
            </button>

            {openMenu === "duration" && (
              <div
                className="absolute bottom-full right-0 z-20 mb-1.5 w-28 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1 shadow-lg"
                role="listbox"
              >
                {DURATION_OPTIONS.map((mins) => {
                  const isActive = durationMinutes === mins;
                  return (
                    <button
                      aria-selected={isActive}
                      className={cn(
                        "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs! leading-4! font-medium! transition-colors cursor-pointer",
                        isActive
                          ? "bg-[var(--color-action-soft)] text-[var(--color-action)]"
                          : "text-[var(--color-text)] hover:bg-[var(--color-surface-subtle)]",
                      )}
                      key={mins}
                      onClick={() => {
                        onDurationChange(mins);
                        setOpenMenu(null);
                      }}
                      role="option"
                      type="button"
                    >
                      <span>{mins} min</span>
                      {isActive && <Check size={12} aria-hidden="true" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              aria-expanded={openMenu === "equipment"}
              aria-haspopup="listbox"
              className="inline-flex h-7 items-center gap-1 rounded-full bg-[var(--color-surface)] px-2.5 text-xs! leading-4! font-medium! text-[var(--color-text)] shadow-xs transition-colors hover:opacity-90 cursor-pointer"
              disabled={isLoading}
              onClick={() => setOpenMenu((cur) => (cur === "equipment" ? null : "equipment"))}
              type="button"
            >
              <span>{activeEquipmentLabel}</span>
              <ChevronDown
                size={12}
                className="text-[var(--color-text-muted)]"
                aria-hidden="true"
              />
            </button>

            {openMenu === "equipment" && (
              <div
                className="absolute bottom-full right-0 z-20 mb-1.5 w-36 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1 shadow-lg"
                role="listbox"
              >
                {EQUIPMENT_MODES.map((mode) => {
                  const isActive = selectedEquipment === mode.id;
                  return (
                    <button
                      aria-selected={isActive}
                      className={cn(
                        "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs! leading-4! font-medium! transition-colors cursor-pointer",
                        isActive
                          ? "bg-[var(--color-action-soft)] text-[var(--color-action)]"
                          : "text-[var(--color-text)] hover:bg-[var(--color-surface-subtle)]",
                      )}
                      key={mode.id}
                      onClick={() => {
                        onEquipmentChange(mode.id);
                        setOpenMenu(null);
                      }}
                      role="option"
                      type="button"
                    >
                      <span>{mode.label}</span>
                      {isActive && <Check size={12} aria-hidden="true" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <button
            aria-label="Send prompt"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-action)] text-white transition-all hover:bg-[var(--color-action-hover)] active:scale-95 disabled:opacity-45 cursor-pointer"
            disabled={isLoading}
            onClick={onSend}
            title="Send (Enter)"
            type="button"
          >
            <ArrowUp size={15} strokeWidth={2.5} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
