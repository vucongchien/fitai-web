"use client";

import { Filter, RotateCcw, Search } from "lucide-react";

import type {
  AdminUserRole,
  AdminUserStatus,
  UserAdminFilters,
} from "@/features/admin/domain/admin-types";

export interface UserFiltersProps {
  filters: UserAdminFilters;
  onChange: (filters: UserAdminFilters) => void;
  onReset: () => void;
  showRoleFilter?: boolean;
  showBotToggle?: boolean;
}

export function UserFilters({
  filters,
  onChange,
  onReset,
  showRoleFilter = false,
  showBotToggle = false,
}: UserFiltersProps) {
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-4 space-y-3 shadow-xs">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--color-action)]">
          <Filter className="size-3.5" />
          <span>Filters & Search</span>
        </div>
        <div className="flex items-center gap-3">
          {showBotToggle && (
            <label className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={Boolean(filters.hideBots)}
                onChange={(e) => onChange({ ...filters, hideBots: e.target.checked })}
                className="size-3.5 rounded border-[var(--color-border)] text-[var(--color-action)] focus:ring-0 cursor-pointer"
              />
              <span>Hide AI Bots</span>
            </label>
          )}
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-input)] text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-subtle)] border border-transparent hover:border-[var(--color-border)] transition-colors cursor-pointer"
          >
            <RotateCcw className="size-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      <div
        className={`grid grid-cols-1 ${showRoleFilter ? "sm:grid-cols-3" : "sm:grid-cols-3"} gap-3`}
      >
        {/* Search Input */}
        <div className={`relative ${showRoleFilter ? "" : "sm:col-span-2"}`}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--color-text-dim)]" />
          <input
            type="text"
            placeholder="Search by name, email, ID..."
            value={filters.q}
            onChange={(e) => onChange({ ...filters, q: e.target.value })}
            className="w-full pl-9 pr-3 py-2 text-xs bg-[var(--color-surface-subtle)] border border-[var(--color-border)] focus:border-[var(--color-action)] focus:bg-[var(--color-surface)] rounded-[var(--radius-input)] text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:outline-none focus:ring-2 focus:ring-[var(--color-action-soft)] transition-all"
          />
        </div>

        {/* Role Filter (Optional) */}
        {showRoleFilter && (
          <div>
            <select
              value={filters.role ?? "all"}
              onChange={(e) =>
                onChange({ ...filters, role: e.target.value as AdminUserRole | "all" })
              }
              className="w-full px-3 py-2 text-xs bg-[var(--color-surface-subtle)] border border-[var(--color-border)] focus:border-[var(--color-action)] focus:bg-[var(--color-surface)] rounded-[var(--radius-input)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-action-soft)] transition-all cursor-pointer"
            >
              <option value="all">All Roles</option>
              <option value="admin">Administrator</option>
              <option value="brand">Brand Partner</option>
              <option value="user">Member</option>
            </select>
          </div>
        )}

        {/* Status Filter */}
        <div>
          <select
            value={filters.status}
            onChange={(e) =>
              onChange({ ...filters, status: e.target.value as AdminUserStatus | "all" })
            }
            className="w-full px-3 py-2 text-xs bg-[var(--color-surface-subtle)] border border-[var(--color-border)] focus:border-[var(--color-action)] focus:bg-[var(--color-surface)] rounded-[var(--radius-input)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-action-soft)] transition-all cursor-pointer"
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
