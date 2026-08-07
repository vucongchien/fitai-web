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

/** Closes over nothing, so it lives at module scope with one stable identity. */
const userKey = (user: AdminUser) => user.userId;

type UserColumnHandlers = {
  onView: (user: AdminUser) => void;
  onToggleStatus: (userId: string) => void;
  isToggling: boolean;
};

/**
 * Column definitions live at module scope so the `cell` renderers are created
 * once rather than on every render of the page. Defining them inline also reads
 * to React tooling as declaring components during render.
 */
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
          <div className="size-9 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs shrink-0 overflow-hidden shadow-xs">
            <UserAvatar alt={u.displayName} size={36} src={u.avatarUrl} />
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-slate-900 text-sm truncate">{u.displayName}</h4>
            <p className="text-xs text-slate-500 truncate">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Role",
      cell: (u) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
          <Shield className="size-3 text-indigo-600" />
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
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-rose-50 text-rose-700 border-rose-200"
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
        <span className="text-xs text-slate-700 font-mono">
          {u.biologicalMetrics.heightCm}cm / {u.biologicalMetrics.weightKg}kg
        </span>
      ),
    },
    {
      header: "Completion Rate",
      cell: (u) => (
        <span className="text-xs font-bold text-indigo-600 font-mono">
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
            className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
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
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1 border transition-colors cursor-pointer ${
              u.status === "active"
                ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200"
                : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
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

  const users = useMemo(() => {
    return data?.pages.flatMap((page) => page.items) ?? [];
  }, [data]);

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
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2 font-display">
            <span>User Management</span>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200">
              {totalCount} Members
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
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
