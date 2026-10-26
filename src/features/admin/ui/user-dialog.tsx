"use client";

import {
  Calendar,
  Check,
  Coins,
  Copy,
  Lock,
  Mail,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Unlock,
  UserCheck,
  X,
} from "lucide-react";
import { useState } from "react";

import type { AdminUser } from "@/features/admin/domain/admin-types";
import { USER_ROLE_LABEL, USER_STATUS_LABEL } from "@/features/admin/domain/admin-types";
import { UserAvatar } from "@/features/admin/ui/user-avatar";
import { UserWalletPanel } from "@/features/admin/ui/user-wallet-panel";
import { useScrollLock } from "@/shared/lib/use-scroll-lock";
import { Button } from "@/shared/ui/button";

export interface UserDialogProps {
  isOpen: boolean;
  user?: AdminUser | null;
  onClose: () => void;
  onToggleStatus?: (userId: string, currentStatus?: AdminUser["status"]) => Promise<void>;
}

export function UserDialog({ isOpen, user, onClose, onToggleStatus }: UserDialogProps) {
  useScrollLock(isOpen && Boolean(user));
  const [activeTab, setActiveTab] = useState<"account" | "wallet">("account");
  const [isToggling, setIsToggling] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  if (!isOpen || !user) {
    return null;
  }

  const handleCopyId = () => {
    navigator.clipboard.writeText(user.userId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleToggle = async () => {
    if (!onToggleStatus || isToggling) return;
    try {
      setIsToggling(true);
      await onToggleStatus(user.userId, user.status);
    } finally {
      setIsToggling(false);
    }
  };

  const isBanned = user.status === "banned";
  const isAdmin = user.role === "admin";
  const isBrand = user.role === "brand";

  const getStatusActionText = () => {
    if (isAdmin) {
      return isBanned ? "Khôi phục quyền truy cập Admin" : "Thu hồi quyền truy cập Admin";
    }
    if (isBrand) {
      return isBanned ? "Kích hoạt lại đối tác" : "Tạm ngưng đối tác thương mại";
    }
    return isBanned ? "Mở khóa tài khoản học viên" : "Khóa tài khoản học viên";
  };

  const getSecurityDescription = () => {
    if (isAdmin) {
      return isBanned
        ? "Quyền truy cập Admin đang bị tạm thu hồi. Nhân sự này không thể đăng nhập Control Panel."
        : "Tài khoản có quyền quản trị toàn bộ hệ thống Control Panel.";
    }
    if (isBrand) {
      return isBanned
        ? "Đối tác thương mại đang bị tạm ngưng hoạt động."
        : "Tài khoản đối tác thương mại đang hoạt động bình thường.";
    }
    return isBanned
      ? "Tài khoản hiện đang bị khóa do vi phạm tiêu chuẩn cộng đồng."
      : "Tài khoản đang hoạt động bình thường, có thể đăng nhập và ghi nhận buổi tập.";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-neutral-200/80 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Top Control Bar */}
        <div className="px-5 pt-4 pb-1 flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
            {isAdmin
              ? "Quản trị viên hệ thống"
              : isBrand
                ? "Đối tác thương mại"
                : "Hồ sơ thành viên"}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng modal"
            className="size-7 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Profile Style Header */}
        <div className="px-5 py-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-neutral-900 tracking-tight leading-tight truncate">
                {user.displayName || "Thành viên FITAI"}
              </h2>

              <p className="text-[13px] text-neutral-500 font-normal mt-0.5 truncate flex items-center gap-1">
                <Mail className="size-3 text-neutral-400 shrink-0" />
                <span className="truncate">{user.email || "Chưa thiết lập email"}</span>
              </p>

              <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                <span
                  className={`px-2 py-0.5 text-[11px] font-semibold rounded-md border ${
                    isAdmin
                      ? "bg-indigo-50 text-indigo-700 border-indigo-200/70"
                      : isBrand
                        ? "bg-purple-50 text-purple-700 border-purple-200/70"
                        : "bg-neutral-100 text-neutral-700 border-neutral-200/80"
                  }`}
                >
                  {USER_ROLE_LABEL[user.role]}
                </span>

                {user.isBot && (
                  <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md border bg-amber-50 text-amber-700 border-amber-200/70">
                    AI Bot mô phỏng
                  </span>
                )}

                <span
                  className={`px-2 py-0.5 text-[11px] font-semibold rounded-md border flex items-center gap-1 ${
                    isBanned
                      ? "bg-rose-50 text-rose-700 border-rose-200/70"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200/70"
                  }`}
                >
                  <span
                    className={`size-1.5 rounded-full ${isBanned ? "bg-rose-500" : "bg-emerald-500"}`}
                  />
                  {USER_STATUS_LABEL[user.status]}
                </span>

                <button
                  type="button"
                  onClick={handleCopyId}
                  title="Sao chép User ID"
                  className="px-1.5 py-0.5 rounded-md bg-neutral-100 hover:bg-neutral-200/70 text-neutral-500 hover:text-neutral-800 text-[10px] font-mono flex items-center gap-1 cursor-pointer transition-colors border border-neutral-200/60"
                >
                  <span>{user.userId.slice(0, 8)}...</span>
                  {copiedId ? (
                    <Check className="size-2.5 text-emerald-600" />
                  ) : (
                    <Copy className="size-2.5 text-neutral-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Avatar Circle */}
            <div className="relative h-15 w-15 flex-shrink-0 overflow-hidden rounded-full ring-1 ring-neutral-200/90 bg-neutral-100 flex items-center justify-center font-bold text-lg text-neutral-700">
              <UserAvatar alt={user.displayName} size={60} src={user.avatarUrl} />
            </div>
          </div>
        </div>

        {/* Tab Switcher - only for normal trainees with FitCoins wallet */}
        {!isAdmin && !isBrand && (
          <div className="px-5 pt-2 pb-1 bg-white border-b border-neutral-100">
            <div className="p-1 bg-neutral-100 rounded-xl flex gap-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab("account")}
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === "account"
                    ? "bg-white text-neutral-900 font-bold"
                    : "text-neutral-500 hover:text-neutral-800"
                }`}
              >
                <Shield className="size-3.5 text-indigo-600" />
                <span>Tài khoản & Phân quyền</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("wallet")}
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === "wallet"
                    ? "bg-white text-neutral-900 font-bold"
                    : "text-neutral-500 hover:text-neutral-800"
                }`}
              >
                <Coins className="size-3.5 text-amber-500" />
                <span>Ví FitCoins & Sổ cái</span>
              </button>
            </div>
          </div>
        )}

        {/* Scrollable Content Body */}
        <div className="p-5 overflow-y-auto overscroll-contain flex-1 bg-white">
          {activeTab === "account" || isAdmin || isBrand ? (
            <div className="space-y-3">
              {/* Account Quick Metrics Card */}
              <div className="p-3.5 rounded-xl border border-neutral-200/60 bg-neutral-50/50 space-y-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">
                  Thông tin hệ thống
                </span>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500 flex items-center gap-1.5">
                      <ShieldCheck className="size-3.5 text-indigo-600" />
                      Cổng xác thực
                    </span>
                    <span className="font-semibold text-neutral-800 capitalize">
                      {user.provider}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500 flex items-center gap-1.5">
                      <Calendar className="size-3.5 text-indigo-600" />
                      Ngày khởi tạo
                    </span>
                    <span className="font-semibold text-neutral-800 font-mono">
                      {new Date(user.createdAt).toLocaleDateString("vi-VN", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                      })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500 flex items-center gap-1.5">
                      <UserCheck className="size-3.5 text-indigo-600" />
                      Phân quyền vai trò
                    </span>
                    <span className="font-semibold text-neutral-800">
                      {USER_ROLE_LABEL[user.role]}
                    </span>
                  </div>
                </div>
              </div>

              {/* Security & Access Management Card */}
              <div className="p-3.5 rounded-xl border border-neutral-200/60 bg-neutral-50/50 space-y-2.5">
                <div className="flex items-center gap-1.5">
                  <ShieldAlert className="size-3.5 text-neutral-500" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                    {isAdmin
                      ? "Bảo mật quyền Admin"
                      : isBrand
                        ? "Tình trạng đối tác"
                        : "Bảo mật & Kỷ luật"}
                  </span>
                </div>

                <p className="text-xs text-neutral-600 leading-relaxed">
                  {getSecurityDescription()}
                </p>

                {onToggleStatus && (
                  <div className="pt-1">
                    <Button
                      type="button"
                      variant={isBanned ? "primary" : "danger"}
                      loading={isToggling}
                      onClick={handleToggle}
                      className="w-full text-xs"
                    >
                      {isBanned ? (
                        <>
                          <Unlock className="size-3.5" />
                          <span>{getStatusActionText()}</span>
                        </>
                      ) : (
                        <>
                          <Lock className="size-3.5" />
                          <span>{getStatusActionText()}</span>
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <UserWalletPanel userId={user.userId} />
          )}
        </div>
      </div>
    </div>
  );
}
