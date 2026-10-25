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

export interface UserDialogProps {
  isOpen: boolean;
  user?: AdminUser | null;
  onClose: () => void;
  onToggleStatus?: (userId: string, currentStatus?: AdminUser["status"]) => Promise<void>;
}

export function UserDialog({ isOpen, user, onClose, onToggleStatus }: UserDialogProps) {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-[460px] bg-white rounded-[32px] shadow-[0_24px_70px_-12px_rgba(0,0,0,0.18)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Hero Profile Header */}
        <div className="relative px-6 pt-6 pb-4 bg-white text-center">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 size-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer z-10"
          >
            <X className="size-4" />
          </button>

          <div className="flex flex-col items-center">
            <div className="size-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white font-bold text-xl flex items-center justify-center shadow-md overflow-hidden shrink-0 ring-4 ring-indigo-50/80">
              <UserAvatar alt={user.displayName} size={64} src={user.avatarUrl} />
            </div>

            <h2 className="text-base font-bold text-slate-900 mt-2.5 truncate max-w-[340px]">
              {user.displayName || "Thành viên FITAI"}
            </h2>

            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
              <Mail className="size-3 text-slate-400 shrink-0" />
              <span className="truncate max-w-[280px]">{user.email || "Chưa có email"}</span>
            </div>

            <div className="flex items-center justify-center gap-2 mt-2.5 flex-wrap">
              <span
                className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-full uppercase tracking-wider ${
                  isAdmin ? "bg-indigo-50 text-indigo-700" : "bg-slate-100 text-slate-600"
                }`}
              >
                {USER_ROLE_LABEL[user.role]}
              </span>

              <span
                className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-full flex items-center gap-1.5 uppercase tracking-wider ${
                  isBanned ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"
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
                className="px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 text-[10px] font-mono flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>{user.userId.slice(0, 8)}...</span>
                {copiedId ? (
                  <Check className="size-2.5 text-emerald-600" />
                ) : (
                  <Copy className="size-2.5 text-slate-400" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Segmented Tab Bar */}
        <div className="px-6 py-1 bg-white">
          <div className="p-1 bg-slate-100 rounded-2xl flex gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("account")}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "account"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Shield className="size-3.5 text-indigo-600" />
              <span>Tài khoản & Bảo mật</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("wallet")}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "wallet"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Coins className="size-3.5 text-amber-500" />
              <span>Ví FitCoins & Sổ cái</span>
            </button>
          </div>
        </div>

        {/* Scrollable Main Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-white">
          {activeTab === "account" ? (
            <div className="space-y-3.5">
              {/* Account Quick Metrics Card */}
              <div className="p-4 rounded-2xl bg-slate-50/80 space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Thông tin hệ thống
                </span>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <ShieldCheck className="size-3.5 text-indigo-600" />
                      Cổng xác thực
                    </span>
                    <span className="font-bold text-slate-800 capitalize">{user.provider}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Calendar className="size-3.5 text-indigo-600" />
                      Ngày khởi tạo
                    </span>
                    <span className="font-bold text-slate-800 font-mono">
                      {new Date(user.createdAt).toLocaleDateString("vi-VN", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                      })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <UserCheck className="size-3.5 text-indigo-600" />
                      Phân quyền vai trò
                    </span>
                    <span className="font-bold text-slate-800">{USER_ROLE_LABEL[user.role]}</span>
                  </div>
                </div>
              </div>

              {/* Security & Access Management Card */}
              <div className="p-4 rounded-2xl bg-slate-50/80 space-y-3">
                <div className="flex items-center gap-1.5">
                  <ShieldAlert className="size-3.5 text-slate-600" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Trạng thái & Quản trị bảo mật
                  </span>
                </div>

                <p className="text-xs text-slate-600">
                  {isBanned
                    ? "Tài khoản hiện đang bị khóa. Người dùng bị vô hiệu hóa quyền truy cập hệ thống và thực hiện giao dịch."
                    : "Tài khoản đang hoạt động bình thường, có thể đăng nhập và ghi nhận buổi tập."}
                </p>

                {onToggleStatus && (
                  <button
                    type="button"
                    disabled={isToggling}
                    onClick={handleToggle}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50 ${
                      isBanned
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "bg-rose-50 hover:bg-rose-100 text-rose-700"
                    }`}
                  >
                    {isBanned ? (
                      <>
                        <Unlock className="size-3.5" />
                        <span>Mở khóa tài khoản người dùng</span>
                      </>
                    ) : (
                      <>
                        <Lock className="size-3.5" />
                        <span>Khóa tài khoản người dùng</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <UserWalletPanel userId={user.userId} />
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-white border-t border-slate-50 flex items-center">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200/90 text-slate-700 text-xs font-bold transition-colors cursor-pointer text-center"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </div>
  );
}
