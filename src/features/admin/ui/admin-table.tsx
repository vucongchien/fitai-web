"use client";

import { AlertCircle, Inbox, Loader2, RefreshCw } from "lucide-react";
import { useEffect, useRef } from "react";

export type Column<T> = {
  header: string;
  cell: (item: T) => React.ReactNode;
  className?: string;
};

export type AdminTableProps<T> = {
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
};

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
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // IntersectionObserver trigger fetchNextPage when sentinel is visible
  useEffect(() => {
    if (!fetchNextPage || !hasNextPage || isFetchingNextPage || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { rootMargin: "100px" },
    );

    const currentSentinel = sentinelRef.current;
    if (currentSentinel) {
      observer.observe(currentSentinel);
    }

    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel);
      }
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, isLoading]);

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          {/* Header */}
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold text-xs uppercase tracking-wider">
              {columns.map((col, idx) => (
                <th key={idx} className={`py-3.5 px-4 ${col.className || ""}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {/* First Page Loading State */}
            {isLoading &&
              data.length === 0 &&
              Array.from({ length: 5 }).map((_, rIdx) => (
                <tr key={rIdx} className="animate-pulse">
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className={`py-4 px-4 ${col.className || ""}`}>
                      <div className="h-4 bg-slate-200 rounded-md w-3/4" />
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
                    onRowClick ? "cursor-pointer hover:bg-indigo-50/40" : "hover:bg-slate-50"
                  }`}
                >
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className={`py-3.5 px-4 ${col.className || ""}`}>
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
            <div className="size-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-3 border border-rose-200">
              <AlertCircle className="size-6" />
            </div>
            <p className="text-slate-900 font-bold text-sm mb-1">Failed to load data</p>
            <p className="text-slate-500 text-xs max-w-sm mb-4">
              {error.message || "Please check your connection and try again."}
            </p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-300 transition-colors cursor-pointer"
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
            <div className="size-14 rounded-2xl bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center mb-4">
              <Inbox className="size-7" />
            </div>
            <h3 className="text-slate-900 font-bold text-sm mb-1">{emptyTitle}</h3>
            <p className="text-slate-500 text-xs max-w-sm">{emptyDescription}</p>
          </div>
        )}

        {/* Infinite Scroll Footer Sentinel */}
        <div ref={sentinelRef} className="py-4 px-4 flex items-center justify-center">
          {isFetchingNextPage && (
            <div className="flex items-center gap-2 text-indigo-600 text-xs font-semibold py-2">
              <Loader2 className="size-4 animate-spin" />
              <span>Loading more records...</span>
            </div>
          )}

          {!hasNextPage && data.length > 0 && !isLoading && (
            <span className="text-slate-400 text-xs font-medium py-2">
              — Showing all {data.length} items —
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
