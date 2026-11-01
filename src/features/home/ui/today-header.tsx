"use client";

import { Plus } from "lucide-react";
import Link from "next/link";

import { NAV_FORWARD } from "@/shared/ui/transition-types";

interface TodayHeaderProps {
  dateLabel?: string;
}

export function TodayHeader({ dateLabel = "Hôm nay" }: TodayHeaderProps) {
  return (
    <header className="today-header px-5 sm:px-6 pt-6 pb-2 flex items-center justify-between">
      <div className="today-header__titles">
        <h1 className="display-title">{dateLabel}</h1>
      </div>
      <Link
        href="/workouts/adhoc"
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-sky-50 text-sky-600 hover:bg-sky-100 border border-sky-200/80 text-xs font-bold transition-all shadow-2xs group cursor-pointer"
        transitionTypes={NAV_FORWARD}
      >
        <Plus size={14} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform" />
        <span>Bài tập mới</span>
      </Link>
    </header>
  );
}
