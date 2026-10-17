"use client";

import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ban, CheckCircle, Eye, Shield } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { fetchAdminUsers, toggleUserStatus } from "@/features/admin/api/admin-user-service";
import type { AdminUser, UserAdminFilters } from "@/features/admin/domain/admin-types";
import {
  DEFAULT_USER_ADMIN_FILTERS,
  USER_ROLE_LABEL,
  USER_STATUS_LABEL,
} from "@/features/admin/domain/admin-types";
import type { Column } from "@/features/admin/ui/admin-table";
import { AdminTable } from "@/features/admin/ui/admin-table";
import { UserAvatar } from "@/features/admin/ui/user-avatar";
import { UserDialog } from "@/features/admin/ui/user-dialog";
import { UserFilters } from "@/features/admin/ui/user-filters";

// Stable key extractor for user rows.
const userKey = (user: AdminUser) => user.userId;

interface UserColumnHandlers {
  onView: (user: AdminUser) => void;
  onToggleStatus: (userId: string) => void;
  isToggling: boolean;
}

// Column definitions kept at module scope to avoid re-creation on render.
function buildUserColumns({
  isToggling,
  onToggleStatus,
  onView,
}: UserColumnHandlers): Column<AdminUser>[] {
  return [
    {
      header: "Member Info",
      cell: (u) => (
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-full bg-[var(--color-action)] flex items-center justify-center text-[var(--color-action-contrast)] font-bold text-xs shrink-0 overflow-hidden shadow-xs">
            <UserAvatar alt={u.displayName} size={36} src={u.avatarUrl} />
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-[var(--color-text)] text-sm truncate">{u.displayName}</h4>
            <p className="text-xs text-[var(--color-text-muted)] truncate">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Role",
      cell: (u) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[var(--color-action-soft)] text-[var(--color-action)] border border-[var(--color-action)]/20">
          <Shield className="size-3 text-[var(--color-action)]" />
          <span>{USER_ROLE_LABEL[u.role]}</span>
        </span>
      ),
    },
    {
      header: "Status",
      cell: (u) => (
        <span
          className={`inline-flex items-center gap-1 py-0.5 px-2.5 rounded-full text-xs font-bold border ${
            u.status === "active"
              ? "bg-[var(--color-recovery-soft)] text-[var(--color-recovery)] border-[var(--color-recovery)]/30"
              : "bg-[var(--color-effort-soft)] text-[var(--color-effort)] border-[var(--color-effort)]/30"
          }`}
        >
          <span className="size-1.5 rounded-full bg-current" />
          <span>{USER_STATUS_LABEL[u.status]}</span>
        </span>
      ),
    },
    {
      header: "Height / Weight",
      cell: (u) => (
        <span className="text-xs text-[var(--color-text)] font-mono">
          {u.biologicalMetrics.heightCm}cm / {u.biologicalMetrics.weightKg}kg
        </span>
      ),
    },
    {
      header: "Completion Rate",
      cell: (u) => (
        <span className="text-xs font-bold text-[var(--color-action)] font-mono">
          {Math.round(u.completionRate * 100)}%
        </span>
      ),
    },
    {
      header: "Actions",
      className: "text-right",
      cell: (u) => (
        <div className="flex items-center justify-end gap-1.5">
          {/* View Profile */}
          <button
            type="button"
            title="View Full Proto Profile"
            onClick={(e) => {
              e.stopPropagation();
              onView(u);
            }}
            className="p-1.5 rounded-[var(--radius-input)] hover:bg-[var(--color-action-soft)] text-[var(--color-text-muted)] hover:text-[var(--color-action)] transition-colors cursor-pointer"
          >
            <Eye className="size-4" />
          </button>

          {/* Toggle Ban / Unban */}
          <button
            type="button"
            title={u.status === "active" ? "Ban Account" : "Unban Account"}
            disabled={isToggling}
            onClick={(e) => {
              e.stopPropagation();
              onToggleStatus(u.userId);
            }}
            className={`px-2.5 py-1.5 rounded-[var(--radius-input)] text-xs font-bold inline-flex items-center gap-1 border transition-colors cursor-pointer ${
              u.status === "active"
                ? "bg-[var(--color-effort-soft)] hover:bg-[var(--color-effort)]/20 text-[var(--color-effort)] border-[var(--color-effort)]/30"
                : "bg-[var(--color-recovery-soft)] hover:bg-[var(--color-recovery)]/20 text-[var(--color-recovery)] border-[var(--color-recovery)]/30"
            }`}
          >
            {u.status === "active" ? (
              <>
                <Ban className="size-3.5" />
                <span>Ban</span>
              </>
            ) : (
              <>
                <CheckCircle className="size-3.5" />
                <span>Unban</span>
              </>
            )}
          </button>
        </div>
      ),
    },
  ];
}

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<UserAdminFilters>(DEFAULT_USER_ADMIN_FILTERS);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  // TanStack Infinite Query
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["admin-users", filters],
    queryFn: ({ pageParam = null }) =>
      fetchAdminUsers({
        cursor: pageParam,
        limit: 10,
        filters,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: null as string | null,
  });

  const users = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data]);

  const totalCount = data?.pages[0]?.totalCount ?? 0;

  // Toggle Ban / Unban Mutation
  const toggleMutation = useMutation({
    mutationFn: (id: string) => toggleUserStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  const handleOpenView = useCallback((user: AdminUser) => {
    setSelectedUser(user);
    setIsDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => setIsDialogOpen(false), []);

  const handleResetFilters = useCallback(() => setFilters(DEFAULT_USER_ADMIN_FILTERS), []);

  const handleRetry = useCallback(() => {
    void refetch();
  }, [refetch]);

  const handleToggleStatus = useCallback(
    async (userId: string) => {
      await toggleMutation.mutateAsync(userId);
    },
    [toggleMutation],
  );

  const columns = useMemo(
    () =>
      buildUserColumns({
        isToggling: toggleMutation.isPending,
        onToggleStatus: handleToggleStatus,
        onView: handleOpenView,
      }),
    [handleOpenView, handleToggleStatus, toggleMutation.isPending],
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text)] flex items-center gap-2 font-display">
            <span>User Management</span>
            <span className="px-2.5 py-0.5 rounded-full bg-[var(--color-action-soft)] text-[var(--color-action)] text-xs font-bold border border-[var(--color-action)]/20">
              {totalCount} Members
            </span>
          </h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            View user profiles, biological metrics, role assignments, and ban status.
          </p>
        </div>
      </div>

      {/* Filters */}
      <UserFilters filters={filters} onChange={setFilters} onReset={handleResetFilters} />

      {/* Table with Infinite Scroll */}
      <AdminTable
        columns={columns}
        data={users}
        keyExtractor={userKey}
        isLoading={isLoading}
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage}
        fetchNextPage={fetchNextPage}
        error={isError ? (error as Error) : null}
        onRetry={handleRetry}
        onRowClick={handleOpenView}
        emptyTitle="No members found"
        emptyDescription="Try adjusting your search term or role/status filters."
      />

      {/* User Detail Dialog */}
      <UserDialog
        isOpen={isDialogOpen}
        user={selectedUser}
        onClose={handleCloseDialog}
        onToggleStatus={handleToggleStatus}
      />
    </div>
  );
}
