"use client";

import type { AdminUserRole, AdminUserStatus, UserAdminFilters } from "@/features/admin/domain/admin-types";
import { Filter, RotateCcw, Search } from "lucide-react";

export type UserFiltersProps = {
  filters: UserAdminFilters;
  onChange: (filters: UserAdminFilters) => void;
  onReset: () => void;
};

export function UserFilters({ filters, onChange, onReset }: UserFiltersProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600">
          <Filter className="size-3.5" />
          <span>User Filters & Search</span>
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, ID..."
            value={filters.q}
            onChange={(e) => onChange({ ...filters, q: e.target.value })}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all"
          />
        </div>

        {/* Role Filter */}
        <div>
          <select
            value={filters.role}
            onChange={(e) =>
              onChange({ ...filters, role: e.target.value as AdminUserRole | "all" })}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all cursor-pointer"
          >
            <option value="all">All Roles</option>
            <option value="admin">Administrator</option>
            <option value="coach">Coach</option>
            <option value="user">Member</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={filters.status}
            onChange={(e) =>
              onChange({ ...filters, status: e.target.value as AdminUserStatus | "all" })}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="banned">Banned</option>
          </select>
        </div>
      </div>
    </div>
  );
}
