"use client";

import { ArrowLeft, Award, Flame, Shield, Target, Trophy, Zap } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import type { BadgeItemVM } from "../model/gamification.types";

interface ProfileBadgesViewProps {
  badges: BadgeItemVM[];
  totalUnlocked: number;
  totalAvailable: number;
}

function renderBadgeVisual(badge: BadgeItemVM, index: number) {
  if (badge.iconUrl) {
    return (
      <div className="relative h-16 w-16 min-w-16 shrink-0 rounded-2xl overflow-hidden shadow-xs border border-neutral-100 flex items-center justify-center bg-neutral-50">
        <Image
          src={badge.iconUrl}
          alt={badge.name}
          width={48}
          height={48}
          className="object-contain"
          unoptimized
        />
      </div>
    );
  }

  const code = (badge.badgeCode || "").toUpperCase();
  const cat = (badge.category || "").toUpperCase();

  let bg = "bg-emerald-500";
  let icon = <Target className="h-7 w-7 text-white mt-0.5" />;
  let level = "CẤP 1";

  if (code.includes("STREAK") || cat.includes("STREAK") || index === 0) {
    bg = "bg-red-500";
    icon = <Flame className="h-7 w-7 text-amber-300 fill-amber-300 mt-0.5" />;
    level = "CẤP 5";
  } else if (code.includes("XP") || code.includes("LEVEL") || cat.includes("LEVEL") || index === 1) {
    bg = "bg-emerald-500";
    icon = <Zap className="h-7 w-7 text-white mt-0.5 fill-white" />;
    level = "CẤP 7";
  } else if (code.includes("LEAGUE") || code.includes("LEADERBOARD") || cat.includes("LEADERBOARD") || index === 2) {
    bg = "bg-purple-500";
    icon = <Shield className="h-7 w-7 text-amber-300 fill-amber-300 mt-0.5" />;
    level = "CẤP 7";
  } else if (code.includes("WORKOUT") || cat.includes("WORKOUT")) {
    bg = "bg-emerald-500";
    icon = <Trophy className="h-7 w-7 text-amber-200 fill-amber-200 mt-0.5" />;
    level = "CẤP 4";
  }

  return (
    <div
      className={`relative h-16 w-16 min-w-16 shrink-0 rounded-2xl ${bg} flex flex-col items-center justify-between p-2 shadow-xs`}
    >
      {icon}
      <span className="text-[10px] font-black text-white uppercase tracking-wider">
        {level}
      </span>
    </div>
  );
}

export function ProfileBadgesView({
  badges,
}: ProfileBadgesViewProps) {
  const router = useRouter();

  const handleDone = () => {
    router.push("/profile");
  };

  return (
    <div className="min-h-screen bg-white pb-20 font-body">
      {/* Top Header Bar - Synchronized with Friends and Settings */}
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
          Tất cả thành tích
        </h1>
        <button
          type="button"
          onClick={handleDone}
          className="text-right text-[15px] font-bold text-sky-500 hover:text-sky-600 transition-colors uppercase tracking-wide cursor-pointer"
        >
          HOÀN TẤT
        </button>
      </header>

      {/* Main Container */}
      <main className="max-w-[560px] mx-auto px-4 pt-5 space-y-4">
        {badges.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200/90 bg-white p-8 text-center shadow-2xs">
            <Award className="mx-auto h-12 w-12 text-neutral-300 mb-3" />
            <h3 className="text-[16px] font-bold text-neutral-800">
              Chưa có thành tích nào
            </h3>
            <p className="text-[13px] text-neutral-400 mt-1 max-w-[320px] mx-auto">
              Các thành tích và huy hiệu sẽ tự động được ghi nhận khi bạn thực hiện các buổi tập và duy trì chuỗi kỷ luật.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-neutral-200/90 bg-white shadow-2xs divide-y divide-neutral-100 overflow-hidden">
            {badges.map((badge, idx) => {
              const target = badge.progressTarget > 0 ? badge.progressTarget : 1;
              const current = Math.min(target, badge.progressCurrent);
              const percent = Math.min(100, Math.round((current / target) * 100));

              return (
                <div key={badge.badgeCode} className="flex items-center gap-4 p-4">
                  {renderBadgeVisual(badge, idx)}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-[16px] font-bold text-neutral-800 truncate">
                        {badge.name}
                      </h3>
                      <span className="text-[14px] font-semibold text-neutral-400 shrink-0">
                        {badge.progressCurrent}/{badge.progressTarget}
                      </span>
                    </div>

                    {/* Refined golden progress bar matching Image 1 */}
                    <div className="mt-2.5 h-3.5 w-full overflow-hidden rounded-full bg-neutral-200/80">
                      <div
                        className="h-full rounded-full bg-amber-400 transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <p className="text-[13px] font-medium text-neutral-500 mt-1.5 leading-snug">
                      {badge.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
