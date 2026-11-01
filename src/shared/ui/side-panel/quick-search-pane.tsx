"use client";

import { Dumbbell, Loader2, Search, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useState, useTransition } from "react";

import { EMPTY_FILTERS, type ExerciseSummary } from "@/features/exercise/domain/exercise";
import { searchExercisesServerAction } from "@/features/exercise/server/catalog-actions";
import { NAV_FORWARD } from "@/shared/ui/transition-types";

const MUSCLE_PILLS = [
  { id: "", label: "Tất cả" },
  { id: "CHEST", label: "Ngực" },
  { id: "BACK", label: "Lưng" },
  { id: "LEGS", label: "Chân" },
  { id: "SHOULDERS", label: "Vai" },
  { id: "ARMS", label: "Tay" },
  { id: "CORE", label: "Cơ bụng" },
] as const;

export function QuickSearchPane() {
  const [query, setQuery] = useState("");
  const [selectedMuscle, setSelectedMuscle] = useState("");
  const [results, setResults] = useState<ExerciseSummary[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isPending, startTransition] = useTransition();

  const performSearch = useCallback((newQuery: string, newMuscle: string) => {
    setHasSearched(true);
    startTransition(async () => {
      try {
        const res = await searchExercisesServerAction({
          ...EMPTY_FILTERS,
          q: newQuery.trim(),
          targetMuscleIds: newMuscle ? [newMuscle] : [],
        });
        setResults(res || []);
      } catch {
        setResults([]);
      }
    });
  }, []);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    performSearch(val, selectedMuscle);
  };

  const handleSelectMuscle = (muscleId: string) => {
    setSelectedMuscle(muscleId);
    performSearch(query, muscleId);
  };

  const handleClear = () => {
    setQuery("");
    performSearch("", selectedMuscle);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Search Input Bar */}
      <div className="p-4 border-b border-neutral-100">
        <div className="relative flex items-center">
          <Search
            aria-hidden="true"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
            size={18}
          />
          <input
            autoFocus
            className="w-full h-11 pl-10 pr-9 text-sm rounded-xl bg-neutral-50 border border-neutral-200 placeholder:text-neutral-400 focus:outline-hidden focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 transition-all"
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Tìm kiếm bài tập (vd: Bench press, Squat...)"
            type="text"
            value={query}
          />
          {query ? (
            <button
              aria-label="Clear search input"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 p-0.5 rounded-full"
              onClick={handleClear}
              type="button"
            >
              <X size={15} />
            </button>
          ) : isPending ? (
            <Loader2
              aria-hidden="true"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 animate-spin"
              size={16}
            />
          ) : null}
        </div>

        {/* Muscle group filter pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar mt-3 pt-0.5 pb-1">
          {MUSCLE_PILLS.map((pill) => {
            const active = selectedMuscle === pill.id;
            return (
              <button
                key={pill.id}
                className={`text-xs px-3 py-1 rounded-full whitespace-nowrap transition-colors font-medium ${
                  active
                    ? "bg-brand-500 text-white shadow-xs"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
                onClick={() => handleSelectMuscle(pill.id)}
                type="button"
              >
                {pill.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results List */}
      <div className="flex-1 overflow-y-auto px-4 py-3 divide-y divide-neutral-100">
        {results.length > 0 ? (
          results.map((exercise) => (
            <Link
              key={exercise.id}
              className="flex items-center gap-3 py-3 group hover:bg-neutral-50 -mx-2 px-2 rounded-xl transition-colors"
              href={`/search/exercises/${exercise.id}`}
              transitionTypes={NAV_FORWARD}
            >
              <div className="relative w-12 h-12 rounded-lg bg-neutral-100 shrink-0 overflow-hidden border border-neutral-200">
                {exercise.thumbnailUrl ? (
                  <Image
                    alt={exercise.name}
                    className="object-cover"
                    fill
                    sizes="48px"
                    src={exercise.thumbnailUrl}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-400">
                    <Dumbbell size={20} />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-neutral-900 truncate group-hover:text-brand-600 transition-colors">
                  {exercise.name}
                </p>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-neutral-500">
                  <span className="capitalize">{exercise.bodyPartId || "Toàn thân"}</span>
                  {exercise.difficulty && (
                    <>
                      <span>•</span>
                      <span className="capitalize">{exercise.difficulty.toLowerCase()}</span>
                    </>
                  )}
                </div>
              </div>
            </Link>
          ))
        ) : hasSearched && !isPending ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-neutral-400">
            <Dumbbell className="text-neutral-300 mb-2" size={32} />
            <p className="text-sm font-medium text-neutral-700">Không tìm thấy bài tập nào</p>
            <p className="text-xs text-neutral-400 mt-1">Thử từ khóa khác hoặc bỏ chọn bộ lọc</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center text-neutral-400">
            <Search className="text-neutral-300 mb-2" size={32} />
            <p className="text-sm font-medium text-neutral-700">Khám phá bài tập nhanh</p>
            <p className="text-xs text-neutral-400 mt-1">
              Nhập tên bài tập hoặc chọn nhóm cơ bên trên
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
