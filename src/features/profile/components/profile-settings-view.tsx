"use client";

import { ArrowLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { ProfileViewModel } from "../model/profile.types";
import type { ModalType } from "./profile-details-modal";
import { ProfileDetailsModal } from "./profile-details-modal";

interface ProfileSettingsViewProps {
  profile: ProfileViewModel;
  onSaveProfile?: (updated: Partial<ProfileViewModel>) => void;
}

export function ProfileSettingsView({
  profile: initialProfile,
  onSaveProfile,
}: ProfileSettingsViewProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileViewModel>(initialProfile);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }
    setIsLoggingOut(true);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });
      if (response.ok) {
        window.location.href = "/login";
      } else {
        console.error("Failed to log out");
        setIsLoggingOut(false);
      }
    } catch (error) {
      console.error("Error during logout:", error);
      setIsLoggingOut(false);
    }
  };

  const handleSave = (updated: Partial<ProfileViewModel>) => {
    setProfile((prev) => ({
      ...prev,
      ...updated,
      user: {
        ...prev.user,
        ...updated.user,
      },
      settings: {
        ...prev.settings,
        ...updated.settings,
      },
      injuries: updated.injuries === undefined ? prev.injuries : updated.injuries,
    }));
    onSaveProfile?.(updated);
  };

  const handleDone = () => {
    router.push("/profile");
  };

  return (
    <div className="min-h-screen bg-white pb-20 font-body">
      {/* Top Header Bar - Synchronized with Badges and Friends */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-neutral-200 bg-white px-4 sm:px-6">
        <button
          type="button"
          onClick={handleDone}
          aria-label="Quay lại hồ sơ"
          className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors cursor-pointer"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-[17px] font-bold text-neutral-800 tracking-tight text-center">
          Cài đặt
        </h1>
        <button
          type="button"
          onClick={handleDone}
          className="text-right text-[15px] font-bold text-sky-500 hover:text-sky-600 transition-colors uppercase tracking-wide cursor-pointer"
        >
          HOÀN TẤT
        </button>
      </header>

      {/* Main Settings Container */}
      <main className="max-w-[560px] mx-auto px-4 pt-5 space-y-6">
        {/* Group 1: Tài khoản */}
        <section className="space-y-2">
          <h2 className="text-[15px] font-bold text-neutral-500 px-1 tracking-tight">
            Tài khoản
          </h2>
          <div className="rounded-2xl border border-neutral-200/90 bg-white shadow-2xs divide-y divide-neutral-200/80 overflow-hidden">
            <button
              type="button"
              onClick={() => setActiveModal("BODY_METRICS")}
              className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-neutral-50 active:bg-neutral-100 cursor-pointer"
            >
              <span className="text-[16px] font-bold text-neutral-800">Cài đặt riêng</span>
              <ChevronRight className="h-5 w-5 text-neutral-400 stroke-[2.5]" />
            </button>

            <button
              type="button"
              onClick={() => setActiveModal("PERSONAL_INFO")}
              className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-neutral-50 active:bg-neutral-100 cursor-pointer"
            >
              <span className="text-[16px] font-bold text-neutral-800">Hồ sơ</span>
              <ChevronRight className="h-5 w-5 text-neutral-400 stroke-[2.5]" />
            </button>

            <button
              type="button"
              onClick={() => setActiveModal("PERSONAL_INFO")}
              className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-neutral-50 active:bg-neutral-100 cursor-pointer"
            >
              <span className="text-[16px] font-bold text-neutral-800">Thông báo</span>
              <ChevronRight className="h-5 w-5 text-neutral-400 stroke-[2.5]" />
            </button>

            <button
              type="button"
              onClick={() => setActiveModal("EQUIPMENT")}
              className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-neutral-50 active:bg-neutral-100 cursor-pointer"
            >
              <span className="text-[16px] font-bold text-neutral-800">Khoá học</span>
              <ChevronRight className="h-5 w-5 text-neutral-400 stroke-[2.5]" />
            </button>

            <button
              type="button"
              onClick={() => setActiveModal("BODY_METRICS")}
              className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-neutral-50 active:bg-neutral-100 cursor-pointer"
            >
              <span className="text-[16px] font-bold text-neutral-800">Điểm trên LinkedIn</span>
              <ChevronRight className="h-5 w-5 text-neutral-400 stroke-[2.5]" />
            </button>

            <button
              type="button"
              onClick={() => setActiveModal("GOALS")}
              className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-neutral-50 active:bg-neutral-100 cursor-pointer"
            >
              <span className="text-[16px] font-bold text-neutral-800">Duolingo for Schools</span>
              <ChevronRight className="h-5 w-5 text-neutral-400 stroke-[2.5]" />
            </button>

            <button
              type="button"
              onClick={() => setActiveModal("PERSONAL_INFO")}
              className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-neutral-50 active:bg-neutral-100 cursor-pointer"
            >
              <span className="text-[16px] font-bold text-neutral-800">Tài khoản mạng xã hội</span>
              <ChevronRight className="h-5 w-5 text-neutral-400 stroke-[2.5]" />
            </button>

            <button
              type="button"
              onClick={() => setActiveModal("INJURY_HISTORY")}
              className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-neutral-50 active:bg-neutral-100 cursor-pointer"
            >
              <span className="text-[16px] font-bold text-neutral-800">Cài đặt quyền riêng tư</span>
              <ChevronRight className="h-5 w-5 text-neutral-400 stroke-[2.5]" />
            </button>
          </div>
        </section>

        {/* Group 2: Subscription Section */}
        <section className="space-y-2">
          <h2 className="text-[15px] font-bold text-neutral-500 px-1 tracking-tight">
            Gói đăng ký
          </h2>
          <div className="rounded-2xl border border-neutral-200/90 bg-white shadow-2xs overflow-hidden">
            <Link
              href="/pricing"
              className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-neutral-50 active:bg-neutral-100 cursor-pointer"
            >
              <span className="text-[16px] font-bold text-neutral-800">Chọn gói đăng ký</span>
              <ChevronRight className="h-5 w-5 text-neutral-400 stroke-[2.5]" />
            </Link>
          </div>
        </section>

        {/* Group 3: Support Section */}
        <section className="space-y-2">
          <h2 className="text-[15px] font-bold text-neutral-500 px-1 tracking-tight">
            Hỗ trợ
          </h2>
          <div className="rounded-2xl border border-neutral-200/90 bg-white shadow-2xs divide-y divide-neutral-200/80 overflow-hidden">
            <button
              type="button"
              onClick={() => setActiveModal("FEEDBACK")}
              className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-neutral-50 active:bg-neutral-100 cursor-pointer"
            >
              <span className="text-[16px] font-bold text-neutral-800">Trung tâm trợ giúp</span>
              <ChevronRight className="h-5 w-5 text-neutral-400 stroke-[2.5]" />
            </button>
          </div>
        </section>

        {/* Logout Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full h-12 rounded-2xl !border-2 !border-solid !border-neutral-200 bg-neutral-100/60 text-[15px] font-bold text-sky-500 hover:bg-neutral-100 hover:text-sky-600 active:scale-98 transition-all shadow-none cursor-pointer flex items-center justify-center uppercase tracking-wider disabled:opacity-50"
          >
            {isLoggingOut ? "Đang đăng xuất..." : "ĐĂNG XUẤT"}
          </button>
        </div>
      </main>

      {/* Modal dialogs */}
      {activeModal && (
        <ProfileDetailsModal
          activeModal={activeModal}
          profile={profile}
          onClose={() => setActiveModal(null)}
          onSaveProfile={handleSave}
        />
      )}
    </div>
  );
}
