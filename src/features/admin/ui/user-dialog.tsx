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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-3xl bg-white border border-slate-200/90 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="size-11 rounded-2xl bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white font-bold text-base flex items-center justify-center shadow-sm overflow-hidden shrink-0 ring-2 ring-indigo-50">
              <UserAvatar alt={user.displayName} size={44} src={user.avatarUrl} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 truncate">
                  {user.displayName || "Thành viên FITAI"}
                </h2>
                <span
                  className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full border uppercase tracking-wider ${
                    isAdmin
                      ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                      : "bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  {USER_ROLE_LABEL[user.role]}
                </span>
                <span
                  className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full border flex items-center gap-1 uppercase tracking-wider ${
                    isBanned
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
                  }`}
                >
                  <span
                    className={`size-1.5 rounded-full ${isBanned ? "bg-rose-500" : "bg-emerald-500"}`}
                  />
                  {USER_STATUS_LABEL[user.status]}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 pt-0.5">
                <span className="truncate flex items-center gap-1">
                  <Mail className="size-3 text-slate-400" />
                  {user.email || "Chưa thiết lập email"}
                </span>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={handleCopyId}
                  title="Sao chép User ID"
                  className="font-mono text-[11px] text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>{user.userId.slice(0, 8)}...</span>
                  {copiedId ? (
                    <Check className="size-3 text-emerald-600" />
                  ) : (
                    <Copy className="size-3 text-slate-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="size-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-4"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 py-2.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
          <div className="inline-flex p-1 bg-slate-200/70 rounded-xl gap-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab("account")}
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "account"
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Shield className="size-3.5 text-indigo-600" />
              <span>Tài khoản & Phân quyền</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("wallet")}
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "wallet"
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Coins className="size-3.5 text-amber-500" />
              <span>Ví FitCoins & Sổ cái</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-500 hidden sm:block">
            {activeTab === "account"
              ? "Bảo mật & Trạng thái hoạt động"
              : "Sổ cái biến động xu thời gian thực"}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/40">
          {activeTab === "account" ? (
            <div className="space-y-4">
              {/* Account Quick Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <ShieldCheck className="size-3.5 text-indigo-600" />
                    Cổng xác thực
                  </span>
                  <p className="text-sm font-bold text-slate-900 capitalize flex items-center gap-1.5">
                    {user.provider}
                  </p>
                  <p className="text-[11px] text-slate-500">Đăng nhập tài khoản</p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Calendar className="size-3.5 text-indigo-600" />
                    Ngày khởi tạo
                  </span>
                  <p className="text-sm font-bold text-slate-900 font-mono">
                    {new Date(user.createdAt).toLocaleDateString("vi-VN", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                    })}
                  </p>
                  <p className="text-[11px] text-slate-500">Gia nhập hệ thống FITAI</p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <UserCheck className="size-3.5 text-indigo-600" />
                    Phân quyền vai trò
                  </span>
                  <p className="text-sm font-bold text-slate-900">{USER_ROLE_LABEL[user.role]}</p>
                  <p className="text-[11px] text-slate-500">
                    {isAdmin ? "Toàn quyền quản trị" : "Quyền hạn thành viên"}
                  </p>
                </div>
              </div>

              {/* Security & Access Management Card */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <ShieldAlert className="size-4 text-slate-600" />
                      Quản lý trạng thái & Bảo mật
                    </h4>
                    <p className="text-xs text-slate-500 pt-0.5">
                      Khóa hoặc mở khóa tài khoản thành viên trong trường hợp phát hiện sự cố.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200/60">
                  <div>
                    <span className="text-xs font-bold text-slate-800">
                      {isBanned ? "Tài khoản đang bị khóa" : "Tài khoản đang hoạt động bình thường"}
                    </span>
                    <p className="text-[11px] text-slate-500 pt-0.5">
                      {isBanned
                        ? "Người dùng không thể truy cập các tính năng luyện tập và hệ thống API."
                        : "Người dùng có thể đăng nhập, ghi nhận buổi tập và sử dụng ví FitCoins."}
                    </p>
                  </div>

                  {onToggleStatus && (
                    <button
                      type="button"
                      disabled={isToggling}
                      onClick={handleToggle}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50 shrink-0 ${
                        isBanned
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white border-transparent"
                          : "bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200"
                      }`}
                    >
                      {isBanned ? (
                        <>
                          <Unlock className="size-3.5" />
                          <span>Mở khóa tài khoản</span>
                        </>
                      ) : (
                        <>
                          <Lock className="size-3.5" />
                          <span>Khóa tài khoản</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <UserWalletPanel userId={user.userId} />
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-white flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </div>
  );
}
