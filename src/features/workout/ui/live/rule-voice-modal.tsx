"use client";

import { FileCheck, Play, Sliders, Volume2, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";

import { speakText } from "@/features/workout/domain/audio-cues";
import type { CoachCue, FormRule, MotionSpec } from "@/features/workout/model/live-session.types";
import { toast } from "@/shared/ui/toast";

export function RuleVoiceModal({
  isOpen,
  onClose,
  onUpdateSpec,
  spec,
}: {
  isOpen: boolean;
  onClose: () => void;
  spec: MotionSpec | null;
  onUpdateSpec?: (newSpec: MotionSpec) => void;
}) {
  const [ttsRate, setTtsRate] = useState(1.0);
  const [ttsPitch, setTtsPitch] = useState(1.0);
  const [rules, setRules] = useState<FormRule[]>(spec?.rules ?? []);
  const [cues, setCues] = useState<CoachCue[]>(spec?.cues ?? []);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleTestTts = useCallback(() => {
    speakText("FitAI pose verification and rep counting system is ready!", "en-US", {
      pitch: ttsPitch,
      rate: ttsRate,
    });
  }, [ttsPitch, ttsRate]);

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) {
        return;
      }
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const json = JSON.parse(evt.target?.result as string);
          const loadedRules: FormRule[] = json.rules || json.form_rules || [];
          const loadedCues: CoachCue[] = json.cues || json.coach_cues || [];
          const loadedCooldowns: Record<string, number> = json.cueCooldownSec || json.cooldowns || {};

          setRules(loadedRules);
          setCues(loadedCues);

          if (spec && onUpdateSpec) {
            const updated: MotionSpec = {
              ...spec,
              cueCooldownSec: { ...spec.cueCooldownSec, ...loadedCooldowns },
              cues: loadedCues.length > 0 ? loadedCues : spec.cues,
              rules: loadedRules.length > 0 ? loadedRules : spec.rules,
            };
            onUpdateSpec(updated);
          }
          toast.success("Rule and Voice configuration loaded successfully!");
          speakText("Updated with new pose evaluation rules!", "en-US", {
            pitch: ttsPitch,
            rate: ttsRate,
          });
        } catch (err) {
          toast.error("Invalid JSON file. Please check the format!");
          console.warn("[RuleVoiceModal] Invalid JSON file:", err);
        }
      };
      reader.readAsText(file);
    },
    [onUpdateSpec, spec, ttsPitch, ttsRate],
  );

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border"
        style={{
          background: "var(--color-surface)",
          borderColor: "var(--color-border)",
          color: "var(--color-text)",
        }}
      >
        {/* Modal Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{
            background: "var(--color-surface-subtle)",
            borderColor: "var(--color-border)",
          }}
        >
          <div className="flex items-center gap-2 font-semibold text-base" style={{ color: "var(--color-text)" }}>
            <Sliders size={18} style={{ color: "var(--color-action)" }} />
            <span>Configure Rule & TTS Voice</span>
          </div>
          <button
            aria-label="Close modal"
            className="p-1 rounded-full transition-colors cursor-pointer"
            onClick={onClose}
            style={{ color: "var(--color-text-muted)" }}
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1 text-sm" style={{ color: "var(--color-text)" }}>
          {/* Section 1: Upload Custom Rule JSON */}
          <div
            className="p-4 rounded-xl border space-y-3"
            style={{
              background: "var(--color-action-soft)",
              borderColor: "var(--color-action)",
            }}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold flex items-center gap-1.5" style={{ color: "var(--color-action-ink)" }}>
                <FileCheck size={16} />
                <span>Load Rule File (Rule JSON)</span>
              </span>
              <input
                accept=".json"
                className="hidden"
                onChange={handleFileUpload}
                ref={fileInputRef}
                type="file"
              />
              <button
                className="px-3 py-1.5 rounded-lg text-white font-medium text-xs shadow-sm transition-all cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                style={{ background: "var(--color-action)" }}
                type="button"
              >
                Upload .JSON
              </button>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
              Upload a JSON rule file to redefine joint thresholds (`thresholdDeg`), pose check types, and cue alerts.
            </p>
          </div>

          {/* Section 2: Text-To-Speech Controls */}
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-1.5" style={{ color: "var(--color-text)" }}>
              <Volume2 size={16} style={{ color: "var(--color-action)" }} />
              <span>TTS Voice Settings (Text-To-Speech)</span>
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium flex justify-between" style={{ color: "var(--color-text-muted)" }}>
                  <span>Speech Rate</span>
                  <span className="font-semibold" style={{ color: "var(--color-text)" }}>{ttsRate}x</span>
                </label>
                <input
                  className="w-full"
                  max="1.5"
                  min="0.7"
                  onChange={(e) => setTtsRate(parseFloat(e.target.value))}
                  step="0.1"
                  style={{ accentColor: "var(--color-action)" }}
                  type="range"
                  value={ttsRate}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium flex justify-between" style={{ color: "var(--color-text-muted)" }}>
                  <span>Pitch</span>
                  <span className="font-semibold" style={{ color: "var(--color-text)" }}>{ttsPitch}</span>
                </label>
                <input
                  className="w-full"
                  max="1.3"
                  min="0.7"
                  onChange={(e) => setTtsPitch(parseFloat(e.target.value))}
                  step="0.1"
                  style={{ accentColor: "var(--color-action)" }}
                  type="range"
                  value={ttsPitch}
                />
              </div>
            </div>

            <button
              className="w-full py-2.5 px-4 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-colors border cursor-pointer"
              onClick={handleTestTts}
              style={{
                background: "var(--color-surface-subtle)",
                borderColor: "var(--color-border)",
                color: "var(--color-text)",
              }}
              type="button"
            >
              <Play size={14} style={{ color: "var(--color-action)", fill: "var(--color-action)" }} />
              <span>Test TTS Voice</span>
            </button>
          </div>

          {/* Section 3: Active Rules & Cues List */}
          <div className="space-y-3">
            <h4 className="font-semibold text-xs uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
              Active Rules ({rules.length}) & Cues ({cues.length})
            </h4>
            {rules.length === 0 ? (
              <div
                className="p-3 text-center text-xs rounded-lg"
                style={{
                  background: "var(--color-surface-subtle)",
                  color: "var(--color-text-muted)",
                }}
              >
                No custom rules configured. Using default AI model rules.
              </div>
            ) : (
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {rules.map((rule, idx) => (
                  <div
                    key={rule.code || idx}
                    className="p-2.5 rounded-lg border flex items-center justify-between text-xs"
                    style={{
                      background: "var(--color-surface-subtle)",
                      borderColor: "var(--color-border)",
                    }}
                  >
                    <span className="font-medium" style={{ color: "var(--color-text)" }}>
                      {rule.message || rule.code}
                    </span>
                    <span className="font-mono text-[11px]" style={{ color: "var(--color-text-muted)" }}>
                      {rule.kind} ({rule.thresholdDeg}°)
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div
          className="p-4 border-t flex justify-end"
          style={{
            background: "var(--color-surface-subtle)",
            borderColor: "var(--color-border)",
          }}
        >
          <button
            className="px-5 py-2 rounded-xl text-white font-medium text-xs shadow-md transition-all cursor-pointer"
            onClick={onClose}
            style={{ background: "var(--color-action)" }}
            type="button"
          >
            Close & Apply
          </button>
        </div>
      </div>
    </div>
  );
}
