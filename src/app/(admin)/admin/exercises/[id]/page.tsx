"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Dumbbell } from "lucide-react";
import Link from "next/link";
import { use } from "react";

import { fetchAdminExerciseById } from "@/features/admin/api/admin-exercise-service";
import { AdminExerciseForm } from "@/features/admin/ui/admin-exercise-form";

export default function AdminExerciseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-exercise", id],
    queryFn: () => fetchAdminExerciseById(id),
  });

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-[var(--color-text-muted)] space-y-3">
        <Dumbbell className="size-8 animate-bounce text-[var(--color-action)]" />
        <p className="text-xs font-semibold">Loading exercise details...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-16 text-center space-y-4">
        <h2 className="text-lg font-bold text-[var(--color-text)]">Could not load exercise</h2>
        <button
          type="button"
          onClick={() => void refetch()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-input)] bg-[var(--color-surface-subtle)] text-[var(--color-text)] text-xs font-bold border border-[var(--color-border)] cursor-pointer"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-16 text-center space-y-4">
        <h2 className="text-lg font-bold text-[var(--color-text)]">Exercise Not Found</h2>
        <p className="text-xs text-[var(--color-text-muted)]">
          The requested exercise with ID `{id}` does not exist.
        </p>
        <Link
          href="/admin/exercises"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-input)] bg-[var(--color-surface-subtle)] hover:bg-[var(--color-surface)] text-[var(--color-text)] text-xs font-bold border border-[var(--color-border)] transition-colors"
        >
          <ArrowLeft className="size-4" />
          <span>Back to Catalog</span>
        </Link>
      </div>
    );
  }

  return <AdminExerciseForm key={data.id} initialExercise={data} />;
}
