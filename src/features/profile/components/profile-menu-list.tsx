"use client";

import {
  AlertTriangle,
  ChevronRight,
  Dumbbell,
  HelpCircle,
  LogOut,
  Scale,
  Target,
  User,
} from "lucide-react";

import type { ProfileViewModel } from "../model/profile.types";

export type ModalType =
  | "BODY_METRICS"
  | "GOALS"
  | "EQUIPMENT"
  | "PERSONAL_INFO"
  | "INJURY_HISTORY"
  | "FEEDBACK"
  | null;

interface ProfileMenuListProps {
  profile: ProfileViewModel;
  onOpenModal: (type: ModalType) => void;
}

export function ProfileMenuList({ profile, onOpenModal }: ProfileMenuListProps) {
  const activeInjuries = profile.injuries.filter((i) => !i.isRecovered);

  return (
    <div className="w-full space-y-1 text-left">
      {/* 1. Body Metrics */}
      <div className="pb-3 border-b border-neutral-200">
        <button
          onClick={() => onOpenModal("BODY_METRICS")}
          className="group flex min-h-[52px] w-full items-center justify-between py-2 px-1 text-left transition-colors hover:bg-neutral-100 rounded-xl"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#4B57F2]">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[#101214] group-hover:text-[#4B57F2] transition-colors">
                Body Metrics
              </div>
              <div className="text-xs text-[#50565C]">
                BMI: <span className="font-mono font-semibold">{profile.healthMetrics.bmi}</span> •{" "}
                {profile.highlights.currentWeightKg}kg ({profile.healthMetrics.bmiCategory})
              </div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400 transition-transform group-hover:translate-x-1" />
        </button>
      </div>

      {/* 2. Training Goals (Tách riêng) */}
      <div className="py-3 border-b border-neutral-200">
        <button
          onClick={() => onOpenModal("GOALS")}
          className="group flex min-h-[52px] w-full items-center justify-between py-2 px-1 text-left transition-colors hover:bg-neutral-100 rounded-xl"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[#101214] group-hover:text-[#4B57F2] transition-colors">
                Training Goals
              </div>
              <div className="text-xs text-[#50565C]">
                {profile.healthMetrics.goals.join(", ")} • {profile.user.experienceLevel}
              </div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400 transition-transform group-hover:translate-x-1" />
        </button>
      </div>

      {/* 3. Available Equipment (Tách riêng) */}
      <div className="py-3 border-b border-neutral-200">
        <button
          onClick={() => onOpenModal("EQUIPMENT")}
          className="group flex min-h-[52px] w-full items-center justify-between py-2 px-1 text-left transition-colors hover:bg-neutral-100 rounded-xl"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Dumbbell className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[#101214] group-hover:text-[#4B57F2] transition-colors">
                Available Equipment
              </div>
              <div className="text-xs text-[#50565C]">
                {profile.settings.availableEquipment.join(", ")}
              </div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400 transition-transform group-hover:translate-x-1" />
        </button>
      </div>

      {/* 4. Personal Info */}
      <div className="py-3 border-b border-neutral-200">
        <button
          onClick={() => onOpenModal("PERSONAL_INFO")}
          className="group flex min-h-[52px] w-full items-center justify-between py-2 px-1 text-left transition-colors hover:bg-neutral-100 rounded-xl"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <User className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[#101214] group-hover:text-[#4B57F2] transition-colors">
                Personal Info
              </div>
              <div className="text-xs text-[#50565C]">
                {profile.user.gender} • {profile.settings.coachStyle} Coach
              </div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400 transition-transform group-hover:translate-x-1" />
        </button>
      </div>

      {/* 5. Injury Management */}
      <div className="py-3 border-b border-neutral-200">
        <button
          onClick={() => onOpenModal("INJURY_HISTORY")}
          className="group flex min-h-[52px] w-full items-center justify-between py-2 px-1 text-left transition-colors hover:bg-neutral-100 rounded-xl"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[#101214] group-hover:text-[#4B57F2] transition-colors">
                Injury Management
              </div>
              <div className="text-xs text-[#50565C]">
                {activeInjuries.length > 0
                  ? `${activeInjuries.length} active injuries reported`
                  : "No active injuries (All clear)"}
              </div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400 transition-transform group-hover:translate-x-1" />
        </button>
      </div>

      {/* 6. Send Feedback */}
      <div className="py-3 border-b border-neutral-200">
        <button
          onClick={() => onOpenModal("FEEDBACK")}
          className="group flex min-h-[52px] w-full items-center justify-between py-2 px-1 text-left transition-colors hover:bg-neutral-100 rounded-xl"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[#101214] group-hover:text-[#4B57F2] transition-colors">
                Send Feedback
              </div>
              <div className="text-xs text-[#50565C]">Help us improve FITAI</div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400 transition-transform group-hover:translate-x-1" />
        </button>
      </div>

      {/* 7. Log Out */}
      <div className="pt-3">
        <button className="group flex min-h-[52px] w-full items-center justify-between py-2 px-1 text-left transition-colors text-rose-600 hover:bg-rose-50/60 rounded-xl">
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <LogOut className="h-5 w-5" />
            </div>
            <div className="text-sm font-semibold">Log Out</div>
          </div>
        </button>
      </div>
    </div>
  );
}
