"use client";

import { Filter, RotateCcw, Search } from "lucide-react";

import type {
  AdminExerciseStatus,
  ExerciseAdminFilters,
} from "@/features/admin/domain/admin-types";
import type { Difficulty } from "@/features/exercise/domain/exercise";

/**
 * Shared empty default so the optional option lists keep a stable identity
 * across renders instead of being re-created as fresh array literals.
 */
const NO_OPTIONS: { id: string; name: string }[] = [];

export interface ExerciseFiltersProps {
  filters: ExerciseAdminFilters;
  onChange: (filters: ExerciseAdminFilters) => void;
  onReset: () => void;
  bodyParts?: { id: string; name: string }[];
  equipments?: { id: string; name: string }[];
}

export function ExerciseFilters({
  filters,
  onChange,
  onReset,
  bodyParts = NO_OPTIONS,
  equipments = NO_OPTIONS,
}: ExerciseFiltersProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600">
          <Filter className="size-3.5" />
          <span>Filters & Search</span>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors cursor-pointer"
        >
          <RotateCcw className="size-3" />
          <span>Reset</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
        {/* Search Input */}
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search exercise name, ID..."
            value={filters.q}
            onChange={(e) => onChange({ ...filters, q: e.target.value })}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all"
          />
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={filters.status}
            onChange={(e) =>
              onChange({ ...filters, status: e.target.value as AdminExerciseStatus | "all" })
            }
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="created">Draft</option>
            <option value="submittedForApproval">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {/* BodyPart Filter */}
        <div>
          <select
            value={filters.bodyPartId}
            onChange={(e) => onChange({ ...filters, bodyPartId: e.target.value })}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all cursor-pointer"
          >
            <option value="">All Body Parts</option>
            {bodyParts.map((bp) => (
              <option key={bp.id} value={bp.id}>
                {bp.name}
              </option>
            ))}
          </select>
        </div>

        {/* Equipment Filter */}
        <div>
          <select
            value={filters.equipmentId}
            onChange={(e) => onChange({ ...filters, equipmentId: e.target.value })}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all cursor-pointer"
          >
            <option value="">All Equipments</option>
            {equipments.map((eq) => (
              <option key={eq.id} value={eq.id}>
                {eq.name}
              </option>
            ))}
          </select>
        </div>

        {/* Difficulty Filter */}
        <div>
          <select
            value={filters.difficulty}
            onChange={(e) =>
              onChange({ ...filters, difficulty: e.target.value as Difficulty | "all" })
            }
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all cursor-pointer"
          >
            <option value="all">All Difficulties</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
      </div>
    </div>
  );
}
