"use client";

import {
  Activity,
  AlertCircle,
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

export interface UserDialogProps {
  isOpen: boolean;
  user?: AdminUser | null;
  onClose: () => void;
  onToggleStatus?: (userId: string) => Promise<void>;
}

export function UserDialog({ isOpen, user, onClose, onToggleStatus }: UserDialogProps) {
  if (!isOpen || !user) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--color-scrim)] backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-card)] shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface-subtle)]">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-[var(--radius-input)] bg-[var(--color-action-soft)] border border-[var(--color-action)]/20 text-[var(--color-action)] flex items-center justify-center">
              <User className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--color-text)]">User Profile (Proto Schema)</h2>
              <p className="text-xs text-[var(--color-text-muted)] font-mono">User ID: {user.userId}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-8 rounded-full hover:bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* User Hero Summary */}
          <div className="flex items-center gap-4 p-4 rounded-[var(--radius-card)] bg-[var(--color-surface-subtle)] border border-[var(--color-border)]">
            <div className="size-16 rounded-[var(--radius-input)] bg-[var(--color-action)] text-[var(--color-action-contrast)] font-bold text-2xl flex items-center justify-center shadow-md overflow-hidden shrink-0">
              <UserAvatar alt={user.displayName} size={64} src={user.avatarUrl} />
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <h3 className="text-base font-bold text-[var(--color-text)] truncate">{user.displayName}</h3>
              <p className="text-xs text-[var(--color-text-muted)] truncate">{user.email}</p>
              <div className="flex items-center gap-2 pt-1">
                <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-[var(--color-action-soft)] text-[var(--color-action)] border border-[var(--color-action)]/20">
                  {USER_ROLE_LABEL[user.role]}
                </span>
                <span
                  className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${
                    user.status === "active"
                      ? "bg-[var(--color-recovery-soft)] text-[var(--color-recovery)] border-[var(--color-recovery)]/30"
                      : "bg-[var(--color-effort-soft)] text-[var(--color-effort)] border-[var(--color-effort)]/30"
                  }`}
                >
                  {USER_STATUS_LABEL[user.status]}
                </span>
              </div>
            </div>
          </div>

          {/* Biological Metrics */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-dim)] flex items-center gap-1.5">
              <HeartPulse className="size-3.5 text-[var(--color-action)]" />
              <span>Biological Metrics</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="p-3 rounded-[var(--radius-input)] bg-[var(--color-surface-subtle)] border border-[var(--color-border)]">
                <span className="text-[var(--color-text-muted)] text-[11px] block">Height</span>
                <span className="font-bold text-[var(--color-text)]">
                  {user.biologicalMetrics.heightCm} cm
                </span>
              </div>
              <div className="p-3 rounded-[var(--radius-input)] bg-[var(--color-surface-subtle)] border border-[var(--color-border)]">
                <span className="text-[var(--color-text-muted)] text-[11px] block">Weight</span>
                <span className="font-bold text-[var(--color-text)]">
                  {user.biologicalMetrics.weightKg} kg
                </span>
              </div>
              <div className="p-3 rounded-[var(--radius-input)] bg-[var(--color-surface-subtle)] border border-[var(--color-border)]">
                <span className="text-[var(--color-text-muted)] text-[11px] block">Body Fat %</span>
                <span className="font-bold text-[var(--color-text)]">
                  {user.biologicalMetrics.bodyFatPercent
                    ? `${user.biologicalMetrics.bodyFatPercent}%`
                    : "—"}
                </span>
              </div>
              <div className="p-3 rounded-[var(--radius-input)] bg-[var(--color-surface-subtle)] border border-[var(--color-border)]">
                <span className="text-[var(--color-text-muted)] text-[11px] block">Completion Rate</span>
                <span className="font-bold text-[var(--color-action)]">
                  {Math.round(user.completionRate * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* Fitness Preferences & Goals */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-[var(--radius-card)] bg-[var(--color-surface-subtle)] border border-[var(--color-border)] space-y-1.5">
              <span className="text-[var(--color-text-muted)] font-medium flex items-center gap-1.5">
                <Dumbbell className="size-3.5 text-[var(--color-action)]" /> Experience Level & Coach Style
              </span>
              <p className="font-bold text-[var(--color-text)]">{user.experienceLevel}</p>
              {user.coachStyle && (
                <p className="text-[11px] text-[var(--color-text-muted)] italic">Style: {user.coachStyle}</p>
              )}
            </div>

            <div className="p-3.5 rounded-[var(--radius-card)] bg-[var(--color-surface-subtle)] border border-[var(--color-border)] space-y-1.5">
              <span className="text-[var(--color-text-muted)] font-medium flex items-center gap-1.5">
                <Activity className="size-3.5 text-[var(--color-action)]" /> Training Goals
              </span>
              <div className="flex flex-wrap gap-1">
                {user.goals.map((g, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-[var(--radius-input)] bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] text-[11px] font-semibold"
                  >
                    {g}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Injuries Record */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-dim)] flex items-center gap-1.5">
              <AlertCircle className="size-3.5 text-[var(--color-effort)]" />
              <span>Injury History</span>
            </h4>
            {user.injuries.length === 0 ? (
              <p className="text-xs text-[var(--color-text-muted)] italic">No reported injuries.</p>
            ) : (
              <div className="space-y-1.5">
                {user.injuries.map((inj) => (
                  <div
                    key={inj.id}
                    className="p-2.5 rounded-[var(--radius-input)] bg-[var(--color-effort-soft)]/40 border border-[var(--color-effort)]/20 text-xs flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-[var(--color-text)]">{inj.affectedArea}</span> —{" "}
                      <span className="text-[var(--color-text-muted)]">{inj.type}</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        inj.isRecovered
                          ? "bg-[var(--color-recovery-soft)] text-[var(--color-recovery)] border-[var(--color-recovery)]/30"
                          : "bg-[var(--color-effort-soft)] text-[var(--color-effort)] border-[var(--color-effort)]/30"
                      }`}
                    >
                      {inj.isRecovered ? "Recovered" : "Active Injury"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Meta System Timeline */}
          <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-[var(--color-border)]">
            <div className="space-y-0.5">
              <span className="text-[var(--color-text-dim)] text-[11px] flex items-center gap-1">
                <Calendar className="size-3" /> Registration Date
              </span>
              <p className="font-semibold text-[var(--color-text)]">
                {new Date(user.createdAt).toLocaleDateString("en-US")}
              </p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[var(--color-text-dim)] text-[11px] flex items-center gap-1">
                <Shield className="size-3" /> OAuth Provider
              </span>
              <p className="font-semibold text-[var(--color-text)] capitalize">{user.provider}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--color-border)] bg-[var(--color-surface-subtle)]">
          {onToggleStatus && (
            <button
              type="button"
              onClick={async () => {
                await onToggleStatus(user.userId);
                onClose();
              }}
              className={`px-4 py-2 rounded-[var(--radius-input)] text-xs font-bold border transition-colors cursor-pointer ${
                user.status === "active"
                  ? "bg-[var(--color-effort-soft)] hover:bg-[var(--color-effort)]/20 text-[var(--color-effort)] border-[var(--color-effort)]/30"
                  : "bg-[var(--color-recovery-soft)] hover:bg-[var(--color-recovery)]/20 text-[var(--color-recovery)] border-[var(--color-recovery)]/30"
              }`}
            >
              {user.status === "active" ? "Ban Account" : "Unban Account"}
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-[var(--radius-input)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-subtle)] text-[var(--color-text)] text-xs font-semibold border border-[var(--color-border)] transition-colors cursor-pointer ml-auto"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
