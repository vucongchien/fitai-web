import { Flame, Salad, Trophy } from "lucide-react";

import { getTopPersonalRecords } from "../model/progress-aggregator";
import type { PersonalRecord, WeeklyNutritionSummary } from "../model/types";

type PersonalRecordsCardProps = {
  records: PersonalRecord[];
  nutrition?: WeeklyNutritionSummary;
};

export function PersonalRecordsCard({ nutrition, records }: PersonalRecordsCardProps) {
  const topRecords = getTopPersonalRecords(records, 3);

  return (
    <div className="bento-card bento-card--prs p-5 rounded-[14px] bg-[var(--color-clear-white,#FFFFFF)] border border-[var(--color-mist,#ECEEF0)] space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Section 1: Personal Records */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[var(--color-blue-tint,#EEF0FF)] flex items-center justify-center text-[var(--color-relay-blue,#4B57F2)]">
                <Trophy className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-graphite,#50565C)]">
                Personal Records
              </span>
            </div>
            <span className="text-[11px] font-semibold text-[var(--color-relay-blue,#4B57F2)]">
              Best Performances
            </span>
          </div>

          {topRecords.length === 0 ? (
            <p className="text-xs text-[var(--color-graphite,#50565C)] py-2">No personal records logged yet.</p>
          ) : (
            <div className="space-y-2">
              {topRecords.map((pr) => (
                <div
                  className="flex items-center justify-between p-2.5 rounded-[10px] bg-[var(--color-soft-paper,#F7F8F6)] border border-[var(--color-mist,#ECEEF0)]"
                  key={pr.id}
                >
                  <span className="text-xs font-semibold text-[var(--color-true-ink,#101214)]">
                    {pr.exerciseName}
                  </span>
                  <span className="font-mono text-xs font-bold text-[var(--color-relay-blue,#4B57F2)] tabular-nums bg-[var(--color-blue-tint,#EEF0FF)] px-2 py-0.5 rounded-[6px]">
                    {pr.metric}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Weekly Nutrition & Total Intake */}
        {nutrition && (
          <div className="space-y-3 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-[var(--color-mist,#ECEEF0)] md:pl-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[var(--color-green-tint,#EAFBF2)] flex items-center justify-center text-[var(--color-field-green,#25C77A)]">
                  <Salad className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-graphite,#50565C)]">
                  Weekly Nutrition & Total Intake
                </span>
              </div>
              <span className="text-[11px] font-semibold text-[var(--color-field-green,#25C77A)]">
                Daily Averages
              </span>
            </div>

            <div className="space-y-2">
              {/* Daily Calories */}
              <div className="p-2.5 rounded-[10px] bg-[var(--color-soft-paper,#F7F8F6)] border border-[var(--color-mist,#ECEEF0)] flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--color-true-ink,#101214)] flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-[var(--color-sprint-coral,#FF5A47)]" />
                  Avg Daily Energy
                </span>
                <span className="font-mono text-xs font-bold text-[var(--color-true-ink,#101214)] tabular-nums">
                  {nutrition.avgDailyCalories.toLocaleString()} / {nutrition.targetDailyCalories.toLocaleString()} kcal
                </span>
              </div>

              {/* Macros Breakdown */}
              <div className="p-2.5 rounded-[10px] bg-[var(--color-soft-paper,#F7F8F6)] border border-[var(--color-mist,#ECEEF0)] flex items-center justify-between text-xs">
                <span className="font-semibold text-[var(--color-graphite,#50565C)]">Macros (P / C / F)</span>
                <div className="font-mono font-bold space-x-1.5 tabular-nums">
                  <span className="text-[var(--color-relay-blue,#4B57F2)]">{nutrition.proteinGrams}g P</span>
                  <span className="text-[var(--color-graphite,#50565C)]">·</span>
                  <span className="text-[var(--color-field-green,#25C77A)]">{nutrition.carbsGrams}g C</span>
                  <span className="text-[var(--color-graphite,#50565C)]">·</span>
                  <span className="text-[var(--color-sprint-coral,#FF5A47)]">{nutrition.fatGrams}g F</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
