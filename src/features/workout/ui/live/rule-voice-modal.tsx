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
    speakText("Hệ thống đếm rep và kiểm tra tư thế FitAI sẵn sàng!", "vi-VN", {
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
          toast.success("Đã tải file cấu hình Rule & Giọng nói thành công!");
          speakText("Đã cập nhật bộ quy tắc kiểm tra tư thế mới!", "vi-VN", {
            pitch: ttsPitch,
            rate: ttsRate,
          });
        } catch (err) {
          toast.error("File JSON không hợp lệ. Vui lòng kiểm tra định dạng!");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-base">
            <Sliders className="text-emerald-500" size={18} />
            <span>Cấu hình Rule & Giọng nói TTS</span>
          </div>
          <button
            aria-label="Close modal"
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            onClick={onClose}
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1 text-sm text-slate-700 dark:text-slate-300">
          {/* Section 1: Upload Custom Rule JSON */}
          <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                <FileCheck size={16} />
                <span>Nạp File Quy tắc (Rule JSON)</span>
              </span>
              <input
                accept=".json"
                className="hidden"
                onChange={handleFileUpload}
                ref={fileInputRef}
                type="file"
              />
              <button
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-sm transition-all"
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                Tải file .JSON
              </button>
            </div>
            <p className="text-xs text-emerald-800/80 dark:text-emerald-400/80 leading-relaxed">
              Tải file quy tắc JSON để định nghĩa lại góc khớp (`thresholdDeg`), loại kiểm tra tư thế và danh sách lời nhắc nhở cảnh báo.
            </p>
          </div>

          {/* Section 2: Text-To-Speech Controls */}
          <div className="space-y-4">
            <h4 className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Volume2 className="text-emerald-500" size={16} />
              <span>Cấu hình Giọng đọc TTS (Text-To-Speech)</span>
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 flex justify-between">
                  <span>Tốc độ đọc (Rate)</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{ttsRate}x</span>
                </label>
                <input
                  className="w-full accent-emerald-500"
                  max="1.5"
                  min="0.7"
                  onChange={(e) => setTtsRate(parseFloat(e.target.value))}
                  step="0.1"
                  type="range"
                  value={ttsRate}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 flex justify-between">
                  <span>Cao độ (Pitch)</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{ttsPitch}</span>
                </label>
                <input
                  className="w-full accent-emerald-500"
                  max="1.3"
                  min="0.7"
                  onChange={(e) => setTtsPitch(parseFloat(e.target.value))}
                  step="0.1"
                  type="range"
                  value={ttsPitch}
                />
              </div>
            </div>

            <button
              className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-medium text-xs flex items-center justify-center gap-2 transition-colors border border-slate-200 dark:border-slate-700"
              onClick={handleTestTts}
              type="button"
            >
              <Play className="text-emerald-500 fill-emerald-500" size={14} />
              <span>Nghe thử giọng đọc TTS tiếng Việt</span>
            </button>
          </div>

          {/* Section 3: Active Rules & Cues List */}
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-900 dark:text-white text-xs uppercase tracking-wider text-slate-400">
              Quy tắc kích hoạt ({rules.length}) & Lời nhắc ({cues.length})
            </h4>
            {rules.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-400 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                Chưa có quy tắc nào. Hệ thống đang sử dụng quy tắc mặc định của mô hình AI.
              </div>
            ) : (
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {rules.map((rule, idx) => (
                  <div
                    key={rule.code || idx}
                    className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs"
                  >
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {rule.message || rule.code}
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">
                      {rule.kind} ({rule.thresholdDeg}°)
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
          <button
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-md transition-all"
            onClick={onClose}
            type="button"
          >
            Đóng & Áp dụng
          </button>
        </div>
      </div>
    </div>
  );
}
