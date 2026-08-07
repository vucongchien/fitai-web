"use client";

import {
  Activity,
  AlertTriangle,
  Calendar,
  Dumbbell,
  HeartPulse,
  Shield,
  User,
  X,
} from "lucide-react";

import type { AdminUser } from "@/features/admin/domain/admin-types";
import { USER_ROLE_LABEL, USER_STATUS_LABEL } from "@/features/admin/domain/admin-types";
import { UserAvatar } from "@/features/admin/ui/user-avatar";

export type UserDialogProps = {
  isOpen: boolean;
  user?: AdminUser | null;
  onClose: () => void;
  onToggleStatus?: (userId: string) => Promise<void>;
};

export function UserDialog({ isOpen, user, onClose, onToggleStatus }: UserDialogProps) {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
              <User className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">User Profile (Proto Schema)</h2>
              <p className="text-xs text-slate-500 font-mono">User ID: {user.userId}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-8 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* User Hero Summary */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="size-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white font-bold text-2xl flex items-center justify-center shadow-md overflow-hidden shrink-0">
              <UserAvatar alt={user.displayName} size={64} src={user.avatarUrl} />
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <h3 className="text-base font-bold text-slate-900 truncate">{user.displayName}</h3>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
              <div className="flex items-center gap-2 pt-1">
                <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {USER_ROLE_LABEL[user.role]}
                </span>
                <span
                  className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${
                    user.status === "active"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-rose-50 text-rose-700 border-rose-200"
                  }`}
                >
                  {USER_STATUS_LABEL[user.status]}
                </span>
              </div>
            </div>
          </div>

          {/* Biological Metrics */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <HeartPulse className="size-3.5 text-indigo-600" />
              <span>Biological Metrics</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 text-[11px] block">Height</span>
                <span className="font-bold text-slate-900">
                  {user.biologicalMetrics.heightCm} cm
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 text-[11px] block">Weight</span>
                <span className="font-bold text-slate-900">
                  {user.biologicalMetrics.weightKg} kg
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 text-[11px] block">Body Fat %</span>
                <span className="font-bold text-slate-900">
                  {user.biologicalMetrics.bodyFatPercent
                    ? `${user.biologicalMetrics.bodyFatPercent}%`
                    : "—"}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 text-[11px] block">Completion Rate</span>
                <span className="font-bold text-indigo-600">
                  {Math.round(user.completionRate * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* Fitness Preferences & Goals */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <Dumbbell className="size-3.5 text-indigo-600" /> Experience Level & Coach Style
              </span>
              <p className="font-bold text-slate-800">{user.experienceLevel}</p>
              {user.coachStyle && (
                <p className="text-[11px] text-slate-500 italic">Style: {user.coachStyle}</p>
              )}
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <Activity className="size-3.5 text-indigo-600" /> Training Goals
              </span>
              <div className="flex flex-wrap gap-1">
                {user.goals.map((g, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 text-[11px] font-semibold"
                  >
                    {g}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Injuries Record */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <AlertTriangle className="size-3.5 text-amber-500" />
              <span>Injury History</span>
            </h4>
            {user.injuries.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No reported injuries.</p>
            ) : (
              <div className="space-y-1.5">
                {user.injuries.map((inj) => (
                  <div
                    key={inj.id}
                    className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-amber-900">{inj.affectedArea}</span> —{" "}
                      {inj.type}
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${inj.isRecovered ? "bg-emerald-100 text-emerald-800" : "bg-amber-200 text-amber-900"}`}
                    >
                      {inj.isRecovered ? "Recovered" : "Active Injury"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Meta System Timeline */}
          <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-100">
            <div className="space-y-0.5">
              <span className="text-slate-400 text-[11px] flex items-center gap-1">
                <Calendar className="size-3" /> Registration Date
              </span>
              <p className="font-semibold text-slate-700">
                {new Date(user.createdAt).toLocaleDateString("en-US")}
              </p>
            </div>
            <div className="space-y-0.5">
              <span className="text-slate-400 text-[11px] flex items-center gap-1">
                <Shield className="size-3" /> OAuth Provider
              </span>
              <p className="font-semibold text-slate-700 capitalize">{user.provider}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50">
          {onToggleStatus && (
            <button
              type="button"
              onClick={async () => {
                await onToggleStatus(user.userId);
                onClose();
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                user.status === "active"
                  ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200"
                  : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
              }`}
            >
              {user.status === "active" ? "Ban Account" : "Unban Account"}
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer ml-auto"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
