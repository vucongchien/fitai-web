"use client";

import { AlertCircle, Inbox, Loader2, RefreshCw } from "lucide-react";
import { useCallback } from "react";

// Fixed synthetic keys for placeholder skeleton rows.
const SKELETON_ROW_KEYS = [
  "skeleton-row-1",
  "skeleton-row-2",
  "skeleton-row-3",
  "skeleton-row-4",
  "skeleton-row-5",
];

export interface Column<T> {
  header: string;
  cell: (item: T) => React.ReactNode;
  className?: string;
}

export interface AdminTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  isLoading?: boolean;
  isFetchingNextPage?: boolean;
  hasNextPage?: boolean;
  fetchNextPage?: () => void;
  error?: Error | null;
  onRetry?: () => void;
  onRowClick?: (item: T) => void;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function AdminTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  isFetchingNextPage = false,
  hasNextPage = false,
  fetchNextPage,
  error = null,
  onRetry,
  onRowClick,
  emptyTitle = "No records found",
  emptyDescription = "Try adjusting your search term or filters.",
}: AdminTableProps<T>) {
  // React 19 Ref Callback Cleanup: IntersectionObserver triggers fetchNextPage when sentinel is visible
  const sentinelCallback = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node || !fetchNextPage || !hasNextPage || isFetchingNextPage || isLoading) {
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            fetchNextPage();
          }
        },
        { rootMargin: "100px" },
      );

      observer.observe(node);

      return () => {
        observer.disconnect();
      };
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage, isLoading],
  );

  return (
    <div className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-hero)] overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          {/* Header */}
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)] font-semibold text-xs uppercase tracking-wider">
              {columns.map((col) => (
                <th key={col.header} className={`py-3.5 px-4 ${col.className || ""}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-[var(--color-border)] text-[var(--color-text)]">
            {/* First Page Loading State */}
            {isLoading &&
              data.length === 0 &&
              SKELETON_ROW_KEYS.map((rowKey) => (
                <tr key={rowKey} className="animate-pulse" aria-hidden="true">
                  {columns.map((col) => (
                    <td
                      aria-hidden="true"
                      className={`py-4 px-4 ${col.className || ""}`}
                      key={col.header}
                    >
                      <div className="h-4 bg-[var(--color-surface-subtle)] rounded-[var(--radius-input)] w-3/4" />
                    </td>
                  ))}
                </tr>
              ))}

            {/* Render Data Rows */}
            {!isLoading &&
              data.length > 0 &&
              data.map((item) => (
                <tr
                  key={keyExtractor(item)}
                  onClick={() => onRowClick && onRowClick(item)}
                  className={`transition-colors duration-150 group ${
                    onRowClick ? "cursor-pointer hover:bg-[var(--color-action-soft)]/50" : "hover:bg-[var(--color-surface-subtle)]"
                  }`}
                >
                  {columns.map((col) => (
                    <td key={col.header} className={`py-3.5 px-4 ${col.className || ""}`}>
                      {col.cell(item)}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>

        {/* Error State */}
        {error && !isLoading && (
          <div className="py-12 px-4 flex flex-col items-center justify-center text-center">
            <div className="size-12 rounded-full bg-[var(--color-danger-soft)] text-[var(--color-danger)] flex items-center justify-center mb-3 border border-[color-mix(in_srgb,var(--color-danger)_25%,transparent)]">
              <AlertCircle className="size-6" />
            </div>
            <p className="text-[var(--color-text)] font-bold text-sm mb-1">Failed to load data</p>
            <p className="text-[var(--color-text-muted)] text-xs max-w-sm mb-4">
              {error.message || "Please check your connection and try again."}
            </p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-input)] bg-[var(--color-surface-subtle)] hover:bg-[var(--color-surface)] text-[var(--color-text)] text-xs font-semibold border border-[var(--color-border)] transition-colors cursor-pointer"
              >
                <RefreshCw className="size-3.5" />
                <span>Retry</span>
              </button>
            )}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && data.length === 0 && (
          <div className="py-16 px-4 flex flex-col items-center justify-center text-center">
            <div className="size-14 rounded-[var(--radius-card)] bg-[var(--color-surface-subtle)] border border-[var(--color-border)] text-[var(--color-text-muted)] flex items-center justify-center mb-4">
              <Inbox className="size-7" />
            </div>
            <h3 className="text-[var(--color-text)] font-bold text-sm mb-1">{emptyTitle}</h3>
            <p className="text-[var(--color-text-muted)] text-xs max-w-sm">{emptyDescription}</p>
          </div>
        )}

        {/* Infinite Scroll Footer Sentinel */}
        <div ref={sentinelCallback} className="py-4 px-4 flex items-center justify-center">
          {isFetchingNextPage && (
            <div className="flex items-center gap-2 text-[var(--color-action)] text-xs font-semibold py-2">
              <Loader2 className="size-4 animate-spin" />
              <span>Loading more records...</span>
            </div>
          )}

          {!hasNextPage && data.length > 0 && !isLoading && (
            <span className="text-[var(--color-text-muted)] text-xs font-medium py-2">
              — Showing all {data.length} items —
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
