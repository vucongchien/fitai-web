"use client";

import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ban, CheckCircle, Eye, Shield, type LucideIcon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { fetchAdminUsers, toggleUserStatus } from "@/features/admin/api/admin-user-service";
import type {
  AdminUser,
  AdminUserRole,
  UserAdminFilters,
} from "@/features/admin/domain/admin-types";
import { USER_ROLE_LABEL, USER_STATUS_LABEL } from "@/features/admin/domain/admin-types";
import { AdminTable, type Column } from "@/features/admin/ui/admin-table";
import { UserAvatar } from "@/features/admin/ui/user-avatar";
import { UserDialog } from "@/features/admin/ui/user-dialog";
import { UserFilters } from "@/features/admin/ui/user-filters";

const userKey = (user: AdminUser) => user.userId;

interface UserColumnHandlers {
  onView: (user: AdminUser) => void;
  onToggleStatus: (userId: string, currentStatus?: AdminUser["status"]) => void;
  isToggling: boolean;
  infoColumnHeader?: string;
}

function buildUserColumns({
  isToggling,
  onToggleStatus,
  onView,
  infoColumnHeader = "Account Info",
}: UserColumnHandlers): Column<AdminUser>[] {
  return [
    {
      header: infoColumnHeader,
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
          <span>{USER_ROLE_LABEL[u.role] ?? u.role}</span>
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
      header: "Provider",
      cell: (u) => (
        <span className="text-xs font-medium text-[var(--color-text-muted)] capitalize">
          {u.provider}
        </span>
      ),
    },
    {
      header: "Joined Date",
      cell: (u) => (
        <span className="text-xs text-[var(--color-text)] font-mono">
          {new Date(u.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: "Actions",
      className: "text-right",
      cell: (u) => {
        const isActive = u.status === "active";
        return (
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              title="View Account Details"
              onClick={(e) => {
                e.stopPropagation();
                onView(u);
              }}
              className="p-1.5 rounded-[var(--radius-input)] hover:bg-[var(--color-action-soft)] text-[var(--color-text-muted)] hover:text-[var(--color-action)] transition-colors cursor-pointer"
            >
              <Eye className="size-4" />
            </button>
            <button
              type="button"
              title={isActive ? "Ban Account" : "Unban Account"}
              disabled={isToggling}
              onClick={(e) => {
                e.stopPropagation();
                onToggleStatus(u.userId, u.status);
              }}
              className={`px-2.5 py-1.5 rounded-[var(--radius-input)] text-xs font-bold inline-flex items-center gap-1 border transition-colors cursor-pointer ${
                isActive
                  ? "bg-[var(--color-effort-soft)] hover:bg-[var(--color-effort)]/20 text-[var(--color-effort)] border-[var(--color-effort)]/30"
                  : "bg-[var(--color-recovery-soft)] hover:bg-[var(--color-recovery)]/20 text-[var(--color-recovery)] border-[var(--color-recovery)]/30"
              }`}
            >
              {isActive ? (
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
        );
      },
    },
  ];
}

export interface AccountManagementViewProps {
  accountRole: AdminUserRole;
  title: string;
  description: string;
  badgeLabel: string;
  emptyTitle: string;
  emptyDescription: string;
  infoColumnHeader?: string;
  icon?: LucideIcon;
}

export function AccountManagementView({
  accountRole,
  title,
  description,
  badgeLabel,
  emptyTitle,
  emptyDescription,
  infoColumnHeader,
  icon: HeaderIcon,
}: AccountManagementViewProps) {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<UserAdminFilters>({
    q: "",
    status: "all",
    role: accountRole,
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  const queryKey = useMemo(() => ["admin-users", accountRole, filters], [accountRole, filters]);

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
    queryKey,
    queryFn: ({ pageParam = null }) =>
      fetchAdminUsers({
        cursor: pageParam,
        limit: 10,
        filters: { ...filters, role: accountRole },
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: null as string | null,
  });

  const users = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data]);
  const totalCount = data?.pages[0]?.totalCount ?? 0;

  const toggleMutation = useMutation({
    mutationFn: ({
      userId,
      currentStatus,
    }: {
      userId: string;
      currentStatus?: AdminUser["status"];
    }) => toggleUserStatus(userId, currentStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  const handleOpenView = useCallback((user: AdminUser) => {
    setSelectedUser(user);
    setIsDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => setIsDialogOpen(false), []);

  const handleResetFilters = useCallback(() => {
    setFilters({ q: "", status: "all", role: accountRole });
  }, [accountRole]);

  const handleRetry = useCallback(() => {
    void refetch();
  }, [refetch]);

  const handleToggleStatus = useCallback(
    async (userId: string, currentStatus?: AdminUser["status"]) => {
      await toggleMutation.mutateAsync({ userId, currentStatus });
    },
    [toggleMutation],
  );

  const columns = useMemo(
    () =>
      buildUserColumns({
        isToggling: toggleMutation.isPending,
        onToggleStatus: handleToggleStatus,
        onView: handleOpenView,
        infoColumnHeader,
      }),
    [handleOpenView, handleToggleStatus, toggleMutation.isPending, infoColumnHeader],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text)] flex items-center gap-2 font-display">
            {HeaderIcon && <HeaderIcon className="size-5 text-[var(--color-action)]" />}
            <span>{title}</span>
            <span className="px-2.5 py-0.5 rounded-full bg-[var(--color-action-soft)] text-[var(--color-action)] text-xs font-bold border border-[var(--color-action)]/20">
              {totalCount} {badgeLabel}
            </span>
          </h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">{description}</p>
        </div>
      </div>

      <UserFilters
        filters={filters}
        onChange={setFilters}
        onReset={handleResetFilters}
        showRoleFilter={false}
      />

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
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
      />

      <UserDialog
        isOpen={isDialogOpen}
        user={selectedUser}
        onClose={handleCloseDialog}
        onToggleStatus={handleToggleStatus}
      />
    </div>
  );
}
