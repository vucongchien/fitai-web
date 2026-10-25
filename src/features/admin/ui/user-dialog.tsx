"use client";

import { Calendar, Coins, Lock, Mail, Shield, Unlock, User, X } from "lucide-react";
import { useState } from "react";

import type { AdminUser } from "@/features/admin/domain/admin-types";
import { USER_ROLE_LABEL, USER_STATUS_LABEL } from "@/features/admin/domain/admin-types";
import { UserAvatar } from "@/features/admin/ui/user-avatar";
import { UserWalletPanel } from "@/features/admin/ui/user-wallet-panel";

export interface UserDialogProps {
  isOpen: boolean;
  user?: AdminUser | null;
  onClose: () => void;
  onToggleStatus?: (userId: string, currentStatus?: AdminUser["status"]) => Promise<void>;
}

export function UserDialog({ isOpen, user, onClose, onToggleStatus }: UserDialogProps) {
  const [activeTab, setActiveTab] = useState<"account" | "wallet">("account");
  const [isToggling, setIsToggling] = useState(false);

  if (!isOpen || !user) {
    return null;
  }

  const handleToggle = async () => {
    if (!onToggleStatus || isToggling) return;
    try {
      setIsToggling(true);
      await onToggleStatus(user.userId, user.status);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--color-scrim)] backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-card)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface-subtle)]">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-[var(--radius-input)] bg-[var(--color-action-soft)] border border-[var(--color-action)]/20 text-[var(--color-action)] flex items-center justify-center">
              <User className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--color-text)]">
                {user.displayName || "Chi tiết Người dùng"}
              </h2>
              <p className="text-xs text-[var(--color-text-muted)] font-mono">ID: {user.userId}</p>
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

        {/* Tab Navigation */}
        <div className="flex border-b border-[var(--color-border)] bg-[var(--color-surface)] px-6 pt-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("account")}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === "account"
                ? "border-[var(--color-action)] text-[var(--color-action)]"
                : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            }`}
          >
            <Shield className="size-3.5" />
            <span>Tài khoản & Phân quyền</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("wallet")}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === "wallet"
                ? "border-[var(--color-action)] text-[var(--color-action)]"
                : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            }`}
          >
            <Coins className="size-3.5" />
            <span>Ví FitCoins & Sổ cái</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === "account" ? (
            <div className="space-y-4">
              {/* User Hero Summary */}
              <div className="flex items-center gap-4 p-4 rounded-[var(--radius-card)] bg-[var(--color-surface-subtle)] border border-[var(--color-border)]">
                <div className="size-16 rounded-[var(--radius-input)] bg-[var(--color-action)] text-[var(--color-action-contrast)] font-bold text-2xl flex items-center justify-center shadow-md overflow-hidden shrink-0">
                  <UserAvatar alt={user.displayName} size={64} src={user.avatarUrl} />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <h3 className="text-base font-bold text-[var(--color-text)] truncate">
                    {user.displayName}
                  </h3>
                  <p className="text-xs text-[var(--color-text-muted)] truncate flex items-center gap-1">
                    <Mail className="size-3" /> {user.email || "—"}
                  </p>
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

              {/* Account Meta Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-[var(--radius-input)] bg-[var(--color-surface-subtle)] border border-[var(--color-border)] space-y-1">
                  <span className="text-[var(--color-text-dim)] text-[11px] flex items-center gap-1">
                    <Shield className="size-3 text-[var(--color-action)]" /> Nhà cung cấp
                  </span>
                  <p className="font-semibold text-[var(--color-text)] capitalize">
                    {user.provider}
                  </p>
                </div>

                <div className="p-3.5 rounded-[var(--radius-input)] bg-[var(--color-surface-subtle)] border border-[var(--color-border)] space-y-1">
                  <span className="text-[var(--color-text-dim)] text-[11px] flex items-center gap-1">
                    <Calendar className="size-3 text-[var(--color-action)]" /> Ngày khởi tạo
                  </span>
                  <p className="font-semibold text-[var(--color-text)] font-mono">
                    {new Date(user.createdAt).toLocaleDateString("vi-VN", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <UserWalletPanel userId={user.userId} />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--color-border)] bg-[var(--color-surface-subtle)]">
          {onToggleStatus && activeTab === "account" && (
            <button
              type="button"
              disabled={isToggling}
              onClick={handleToggle}
              className={`px-4 py-2 rounded-[var(--radius-input)] text-xs font-bold border inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 ${
                user.status === "active"
                  ? "bg-[var(--color-effort-soft)] hover:bg-[var(--color-effort)]/20 text-[var(--color-effort)] border-[var(--color-effort)]/30"
                  : "bg-[var(--color-recovery-soft)] hover:bg-[var(--color-recovery)]/20 text-[var(--color-recovery)] border-[var(--color-recovery)]/30"
              }`}
            >
              {user.status === "active" ? (
                <>
                  <Lock className="size-3.5" />
                  <span>Khóa tài khoản</span>
                </>
              ) : (
                <>
                  <Unlock className="size-3.5" />
                  <span>Mở khóa tài khoản</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-[var(--radius-input)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-subtle)] text-[var(--color-text)] text-xs font-semibold border border-[var(--color-border)] transition-colors cursor-pointer ml-auto"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
