"use client";

import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Archive, CheckCircle2, Dumbbell, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import {
  approveExercise,
  archiveExercise,
  createExercise,
  deleteExercise,
  fetchAdminExercises,
} from "@/features/admin/api/admin-exercise-service";
import type { AdminExercise, ExerciseAdminFilters } from "@/features/admin/domain/admin-types";
import {
  DEFAULT_EXERCISE_ADMIN_FILTERS,
  EXERCISE_STATUS_LABEL,
  EXERCISE_STATUS_STYLE,
} from "@/features/admin/domain/admin-types";
import type { Column } from "@/features/admin/ui/admin-table";
import { AdminTable } from "@/features/admin/ui/admin-table";
import { ExerciseFilters } from "@/features/admin/ui/exercise-filters";
import { DIFFICULTY_LABEL } from "@/features/exercise/domain/exercise";

/** Closes over nothing, so it lives at module scope with one stable identity. */
const exerciseKey = (exercise: AdminExercise) => exercise.id;

interface ExerciseColumnHandlers {
  onApprove: (id: string) => void;
  onArchive: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (event: React.MouseEvent, exercise: AdminExercise) => void;
  isApproving: boolean;
  isArchiving: boolean;
}

// Column definitions kept at module scope to avoid re-creation on render.
function buildExerciseColumns({
  isApproving,
  isArchiving,
  onApprove,
  onArchive,
  onDelete,
  onEdit,
}: ExerciseColumnHandlers): Column<AdminExercise>[] {
  return [
    {
      header: "Exercise Name",
      cell: (ex) => (
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-[var(--radius-input)] bg-[var(--color-action-soft)] border border-[color-mix(in_srgb,var(--color-action)_20%,transparent)] flex items-center justify-center text-[var(--color-action)] shrink-0 font-bold">
            <Dumbbell className="size-4.5" />
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-[var(--color-text)] text-sm truncate group-hover:text-[var(--color-action)] transition-colors">
              {ex.name}
            </h4>
            <p className="text-xs text-[var(--color-text-muted)] truncate">Created by: {ex.createdBy}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Status",
      cell: (ex) => {
        const style = EXERCISE_STATUS_STYLE[ex.status];
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${style.bg} ${style.text} ${style.border}`}
          >
            <span className="size-1.5 rounded-full bg-current" />
            <span>{EXERCISE_STATUS_LABEL[ex.status]}</span>
          </span>
        );
      },
    },
    {
      header: "Difficulty",
      cell: (ex) => (
        <span className="text-xs text-[var(--color-text)] font-semibold capitalize">
          {DIFFICULTY_LABEL[ex.difficulty] || ex.difficulty}
        </span>
      ),
    },
    {
      header: "Rest Time",
      cell: (ex) => (
        <span className="text-xs text-[var(--color-text-muted)] font-mono">{ex.defaultRestSeconds}s</span>
      ),
    },
    {
      header: "Quick Actions",
      className: "text-right",
      cell: (ex) => (
        <div className="flex items-center justify-end gap-1.5">
          {/* Approve Action */}
          {(ex.status === "created" || ex.status === "submittedForApproval") && (
            <button
              type="button"
              title="Approve Exercise"
              disabled={isApproving}
              onClick={(e) => {
                e.stopPropagation();
                onApprove(ex.id);
              }}
              className="px-2.5 py-1.5 rounded-[var(--radius-input)] bg-[var(--color-recovery-soft)] hover:opacity-90 text-[var(--color-recovery-ink)] border border-[color-mix(in_srgb,var(--color-recovery)_25%,transparent)] text-xs font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              <CheckCircle2 className="size-3.5" />
              <span>Approve</span>
            </button>
          )}

          {/* Archive Action */}
          {ex.status !== "archived" && (
            <button
              type="button"
              title="Archive Exercise"
              disabled={isArchiving}
              onClick={(e) => {
                e.stopPropagation();
                onArchive(ex.id);
              }}
              className="p-1.5 rounded-[var(--radius-input)] hover:bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors cursor-pointer"
            >
              <Archive className="size-4" />
            </button>
          )}

          {/* Edit / View Route Navigation */}
          <button
            type="button"
            title="Edit Details"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(ex.id);
            }}
            className="p-1.5 rounded-[var(--radius-input)] hover:bg-[var(--color-action-soft)] text-[var(--color-text-muted)] hover:text-[var(--color-action)] transition-colors cursor-pointer"
          >
            <Pencil className="size-4" />
          </button>

          {/* Delete Action */}
          <button
            type="button"
            title="Delete Exercise"
            onClick={(e) => onDelete(e, ex)}
            className="p-1.5 rounded-[var(--radius-input)] hover:bg-[var(--color-danger-soft)] text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors cursor-pointer"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ),
    },
  ];
}

export default function AdminExercisesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<ExerciseAdminFilters>(DEFAULT_EXERCISE_ADMIN_FILTERS);

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
    queryKey: ["admin-exercises", filters],
    queryFn: ({ pageParam = null }) =>
      fetchAdminExercises({
        cursor: pageParam,
        limit: 10,
        filters,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: null as string | null,
  });

  const exercises = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data]);

  const totalCount = data?.pages[0]?.totalCount ?? 0;

  // Mutations
  const approveMutation = useMutation({
    mutationFn: (id: string) => approveExercise(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-exercises"] });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => archiveExercise(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-exercises"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteExercise(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-exercises"] });
    },
  });

  const handleCreateNew = async () => {
    const created = await createExercise({
      name: "New Exercise Draft",
      bodyPartId: "bp-chest",
      equipmentId: "eq-dumbbell",
      targetMuscleId: "ms-pectoralis-major",
      secondaryMuscleIds: [],
      difficulty: "beginner",
      defaultRestSeconds: 60,
      tagIds: [],
      hasAiSupported: false,
      instructions: "Add detailed step-by-step instructions here...",
      formCues: ["Keep core engaged"],
      commonMistakes: ["Flaring elbows"],
      status: "created",
      createdBy: "admin@fitai.com",
    });
    queryClient.invalidateQueries({ queryKey: ["admin-exercises"] });
    router.push(`/admin/exercises/${created.id}`);
  };

  const handleDelete = useCallback(
    async (e: React.MouseEvent, ex: AdminExercise) => {
      e.stopPropagation();
      if (confirm(`Are you sure you want to delete "${ex.name}"?`)) {
        await deleteMutation.mutateAsync(ex.id);
      }
    },
    [deleteMutation],
  );

  const handleApprove = useCallback((id: string) => approveMutation.mutate(id), [approveMutation]);

  const handleArchive = useCallback((id: string) => archiveMutation.mutate(id), [archiveMutation]);

  const handleEdit = useCallback((id: string) => router.push(`/admin/exercises/${id}`), [router]);

  const handleResetFilters = useCallback(() => setFilters(DEFAULT_EXERCISE_ADMIN_FILTERS), []);

  const handleRetry = useCallback(() => {
    void refetch();
  }, [refetch]);

  const handleRowClick = useCallback(
    (exercise: AdminExercise) => router.push(`/admin/exercises/${exercise.id}`),
    [router],
  );

  // Table Columns Definition
  const columns = useMemo(
    () =>
      buildExerciseColumns({
        isApproving: approveMutation.isPending,
        isArchiving: archiveMutation.isPending,
        onApprove: handleApprove,
        onArchive: handleArchive,
        onDelete: handleDelete,
        onEdit: handleEdit,
      }),
    [
      approveMutation.isPending,
      archiveMutation.isPending,
      handleApprove,
      handleArchive,
      handleDelete,
      handleEdit,
    ],
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text)] flex items-center gap-2 font-display">
            <span>Exercise Catalog</span>
            <span className="px-2.5 py-0.5 rounded-full bg-[var(--color-action-soft)] text-[var(--color-action)] text-xs font-bold border border-[color-mix(in_srgb,var(--color-action)_25%,transparent)]">
              {totalCount} Items
            </span>
          </h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Manage exercise entries, approve pending submissions, and edit details.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCreateNew}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[var(--radius-input)] bg-[var(--color-action)] hover:opacity-90 text-[var(--color-action-contrast)] font-bold text-xs shadow-md shadow-[var(--color-action-soft)] transition-all cursor-pointer shrink-0"
        >
          <Plus className="size-4" />
          <span>Add New Exercise</span>
        </button>
      </div>

      {/* Filters */}
      <ExerciseFilters filters={filters} onChange={setFilters} onReset={handleResetFilters} />

      {/* Table with Infinite Scroll */}
      <AdminTable
        columns={columns}
        data={exercises}
        keyExtractor={exerciseKey}
        isLoading={isLoading}
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage}
        fetchNextPage={fetchNextPage}
        error={isError ? (error as Error) : null}
        onRetry={handleRetry}
        onRowClick={handleRowClick}
        emptyTitle="No exercises found"
        emptyDescription="Try adjusting your search query or status filters."
      />
    </div>
  );
}
