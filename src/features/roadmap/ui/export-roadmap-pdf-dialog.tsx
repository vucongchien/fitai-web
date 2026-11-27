"use client";

import { FileText, Globe, LayoutGrid, Printer, SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";

import {
  DEFAULT_ROADMAP_PRINT_OPTIONS,
  printRoadmapPlan,
  type PrintLanguage,
  type PrintLayout,
  type PrintScope,
  type RoadmapPrintOptions,
} from "@/features/roadmap/model/print-plan";
import type { RoadmapPageData } from "@/features/roadmap/model/roadmap-page.types";

interface ExportRoadmapPdfDialogProps {
  data: RoadmapPageData;
  open: boolean;
  onClose: () => void;
}

export function ExportRoadmapPdfDialog({ data, open, onClose }: ExportRoadmapPdfDialogProps) {
  const allWeeks =
    data.allWeeks && data.allWeeks.length > 0
      ? data.allWeeks
      : [
          {
            number: data.activeWeek,
            label: data.currentWeekLabel,
            dateRange: data.currentWeekDateRange,
            state: "active" as const,
            sessions: data.currentWeekSessions,
          },
        ];
  const availableWeeks = allWeeks.map((w) => w.number);

  const [options, setOptions] = useState<RoadmapPrintOptions>(() => ({
    ...DEFAULT_ROADMAP_PRINT_OPTIONS,
    language: "vi",
    selectedWeeks: availableWeeks,
  }));

  if (!open) {
    return null;
  }

  const selectedWeekObjects =
    options.scope === "current"
      ? allWeeks.filter((w) => w.number === data.activeWeek)
      : options.scope === "custom"
        ? allWeeks.filter((w) => options.selectedWeeks.includes(w.number))
        : allWeeks;

  const totalSessions = selectedWeekObjects.reduce(
    (sum, w) =>
      sum +
      (options.includeRestDays
        ? w.sessions.length
        : w.sessions.filter((s) => s.status !== "rest").length),
    0,
  );

  const toggleWeek = (weekNum: number) => {
    setOptions((prev) => {
      const exists = prev.selectedWeeks.includes(weekNum);
      const next = exists
        ? prev.selectedWeeks.filter((w) => w !== weekNum)
        : [...prev.selectedWeeks, weekNum].sort((a, b) => a - b);
      return { ...prev, selectedWeeks: next.length > 0 ? next : [weekNum] };
    });
  };

  const handleExport = () => {
    printRoadmapPlan(data, options);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-pdf-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[var(--color-border)] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-action)]/12 text-[var(--color-action)]">
              <FileText aria-hidden="true" size={18} />
            </div>
            <div>
              <h3 id="export-pdf-title" className="text-base font-bold text-[var(--color-text)]">
                Tùy chỉnh xuất PDF Roadmap
              </h3>
              <p className="text-xs text-[var(--color-text-muted)]">
                Chọn phạm vi, chi tiết bài tập, ngôn ngữ và bố cục in
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="rounded-lg p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-text)] cursor-pointer"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>

        <div className="space-y-5 px-5 py-4 text-sm">
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              <LayoutGrid aria-hidden="true" size={13} />
              Phạm vi in
            </p>
            <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-[var(--color-surface-subtle)] p-1">
              {(
                [
                  { id: "all", label: `Cả ${availableWeeks.length} tuần` },
                  { id: "current", label: `Tuần ${data.activeWeek}` },
                  { id: "custom", label: "Chọn tuần" },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setOptions((prev) => ({ ...prev, scope: item.id as PrintScope }))}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                    options.scope === item.id
                      ? "bg-[var(--color-surface)] text-[var(--color-text)] shadow-xs"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {options.scope === "custom" ? (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {availableWeeks.map((weekNum) => {
                  const checked = options.selectedWeeks.includes(weekNum);
                  return (
                    <button
                      key={weekNum}
                      type="button"
                      onClick={() => toggleWeek(weekNum)}
                      className={`rounded-lg border px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                        checked
                          ? "border-[var(--color-action)] bg-[var(--color-action)] text-white"
                          : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                      }`}
                    >
                      Tuần {weekNum}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                <Globe aria-hidden="true" size={13} />
                Ngôn ngữ nhãn
              </p>
              <div className="grid grid-cols-2 gap-1 rounded-xl bg-[var(--color-surface-subtle)] p-1">
                {(
                  [
                    { id: "vi", label: "Tiếng Việt" },
                    { id: "en", label: "English" },
                  ] as const
                ).map((lang) => (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() =>
                      setOptions((prev) => ({ ...prev, language: lang.id as PrintLanguage }))
                    }
                    className={`rounded-lg px-2 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                      options.language === lang.id
                        ? "bg-[var(--color-surface)] text-[var(--color-text)] shadow-xs"
                        : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                <SlidersHorizontal aria-hidden="true" size={13} />
                Bố cục trang
              </p>
              <div className="grid grid-cols-2 gap-1 rounded-xl bg-[var(--color-surface-subtle)] p-1">
                {(
                  [
                    { id: "detailed", label: "Chi tiết" },
                    { id: "compact", label: "Gọn" },
                  ] as const
                ).map((lay) => (
                  <button
                    key={lay.id}
                    type="button"
                    onClick={() =>
                      setOptions((prev) => ({ ...prev, layout: lay.id as PrintLayout }))
                    }
                    className={`rounded-lg px-2 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                      options.layout === lay.id
                        ? "bg-[var(--color-surface)] text-[var(--color-text)] shadow-xs"
                        : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                    }`}
                  >
                    {lay.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              Nội dung hiển thị
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {(
                [
                  { key: "includeExercises", label: "Chi tiết bài tập (Sets × Reps)" },
                  { key: "includeNotes", label: "Ghi chú cách tập / kỹ thuật" },
                  { key: "includeReasoning", label: "Ghi chú lý do của AI" },
                  { key: "includeRestDays", label: "Bao gồm ngày nghỉ" },
                  { key: "includeCheckboxes", label: "Ô tick hoàn thành (☐)" },
                ] as const
              ).map((item) => {
                const disabled = item.key === "includeNotes" && !options.includeExercises;
                return (
                  <label
                    key={item.key}
                    className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 text-xs transition-colors ${
                      disabled
                        ? "border-[var(--color-border)] opacity-50 cursor-not-allowed"
                        : options[item.key]
                          ? "border-[var(--color-action)]/40 bg-[var(--color-action)]/5 text-[var(--color-text)] cursor-pointer"
                          : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-subtle)] cursor-pointer"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={options[item.key]}
                      disabled={disabled}
                      onChange={(e) =>
                        setOptions((prev) => ({ ...prev, [item.key]: e.target.checked }))
                      }
                      className="h-4 w-4 accent-[var(--color-action)]"
                    />
                    <span className="font-medium">{item.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] bg-[var(--color-surface-subtle)]/50 px-5 py-3.5">
          <span className="text-xs font-medium text-[var(--color-text-muted)]">
            Sẽ in:{" "}
            <strong className="text-[var(--color-text)]">
              {selectedWeekObjects.length} tuần · {totalSessions} buổi
            </strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="ui-button ui-button--secondary ui-button--medium"
            >
              <span className="ui-button__label">Hủy</span>
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="ui-button ui-button--primary ui-button--medium"
            >
              <span className="ui-button__label">
                <Printer aria-hidden="true" size={16} />
                In / Lưu PDF
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
