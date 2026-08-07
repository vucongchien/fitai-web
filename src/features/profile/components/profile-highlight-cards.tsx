import { Activity, Scale, Target } from "lucide-react";
import type { ProfileHighlightMetrics } from "../model/profile.types";

interface ProfileHighlightCardsProps {
  highlights: ProfileHighlightMetrics;
}

export function ProfileHighlightCards({ highlights }: ProfileHighlightCardsProps) {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {/* Cân nặng hiện tại */}
      <div className="flex flex-col items-center justify-center rounded-xl bg-white p-3 border border-neutral-200/60 text-center">
        <div className="mb-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#EEF0FF] text-[#4B57F2]">
          <Scale className="h-3.5 w-3.5" />
        </div>
        <span className="text-sm font-bold text-[#101214] font-mono">
          {highlights.currentWeightKg} <span className="text-[11px] font-normal text-[#50565C]">kg</span>
        </span>
        <span className="mt-0.5 text-[11px] text-[#50565C]">Weight</span>
      </div>

      {/* Tỉ lệ mỡ */}
      <div className="flex flex-col items-center justify-center rounded-xl bg-white p-3 border border-neutral-200/60 text-center">
        <div className="mb-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#FFF0ED] text-[#FF5A47]">
          <Activity className="h-3.5 w-3.5" />
        </div>
        <span className="text-sm font-bold text-[#101214] font-mono">
          {highlights.bodyFatPercent} <span className="text-[11px] font-normal text-[#50565C]">%</span>
        </span>
        <span className="mt-0.5 text-[11px] text-[#50565C]">Body Fat</span>
      </div>

      {/* Cân nặng mục tiêu */}
      <div className="flex flex-col items-center justify-center rounded-xl bg-white p-3 border border-neutral-200/60 text-center">
        <div className="mb-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#EAFBF2] text-[#25C77A]">
          <Target className="h-3.5 w-3.5" />
        </div>
        <span className="text-sm font-bold text-[#101214] font-mono">
          {highlights.targetWeightKg} <span className="text-[11px] font-normal text-[#50565C]">kg</span>
        </span>
        <span className="mt-0.5 text-[11px] text-[#50565C]">Target</span>
      </div>
    </div>
  );
}
