"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, CheckCircle2, Clock, Filter, RotateCcw, X, XCircle } from "lucide-react";
import { useState } from "react";

import {
  approveBrandRequest,
  fetchBrandRequests,
  rejectBrandRequest,
  type AdminBrandRequestItem,
  type AdminBrandRequestStatus,
} from "@/features/admin/api/admin-brand-service";
import { Button } from "@/shared/ui/button";

export function BrandRequestsTable() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<AdminBrandRequestStatus>("all");
  const [rejectingItem, setRejectingItem] = useState<AdminBrandRequestItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-brand-requests", statusFilter],
    queryFn: () => fetchBrandRequests({ status: statusFilter, page: 1, pageSize: 20 }),
  });

  const approveMutation = useMutation({
    mutationFn: (requestId: string) => approveBrandRequest(requestId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-brand-requests"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ requestId, reason }: { requestId: string; reason: string }) =>
      rejectBrandRequest(requestId, reason),
    onSuccess: () => {
      setRejectingItem(null);
      setRejectReason("");
      void queryClient.invalidateQueries({ queryKey: ["admin-brand-requests"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  const handleApprove = async (id: string) => {
    await approveMutation.mutateAsync(id);
  };

  const handleConfirmReject = async () => {
    if (!rejectingItem) return;
    await rejectMutation.mutateAsync({
      requestId: rejectingItem.id,
      reason: rejectReason || "Yêu cầu không đáp ứng tiêu chuẩn đối tác FITAI",
    });
  };

  const items = data?.items || [];
  const pendingCount = items.filter((i) => i.status === "pending").length;

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--color-action)]">
            <Filter className="size-3.5" />
            <span>Filter Requests</span>
          </div>

          <div className="flex items-center gap-1 bg-[var(--color-surface-subtle)] p-1 rounded-lg border border-[var(--color-border)]">
            {(
              [
                { label: "All", value: "all" },
                { label: "Pending", value: "pending" },
                { label: "Approved", value: "approved" },
                { label: "Rejected", value: "rejected" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setStatusFilter(tab.value)}
                className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                  statusFilter === tab.value
                    ? "bg-[var(--color-surface)] text-[var(--color-text)] shadow-xs"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                }`}
              >
                {tab.label}
                {tab.value === "pending" && pendingCount > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400">
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => void refetch()}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-input)] text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-subtle)] border border-transparent hover:border-[var(--color-border)] transition-colors cursor-pointer"
        >
          <RotateCcw className="size-3" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Table Card */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-card)] overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-[var(--color-text-muted)]">
            <div className="size-6 border-2 border-[var(--color-action)] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span>Loading onboarding requests...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-[var(--color-effort)]">
            Failed to load onboarding requests.
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-xs text-[var(--color-text-muted)] space-y-1">
            <p className="font-bold text-sm text-[var(--color-text)]">No requests found</p>
            <p>No brand partner onboarding requests match the current filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-subtle)] text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                  <th className="py-3 px-4">Brand Information</th>
                  <th className="py-3 px-4">Contact & Location</th>
                  <th className="py-3 px-4">Review Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {items.map((req) => (
                  <tr
                    key={req.id}
                    className="hover:bg-[var(--color-surface-subtle)]/50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-sm text-[var(--color-text)]">
                        {req.brandName}
                      </div>
                      <p className="text-xs text-[var(--color-text-muted)] mt-0.5 max-w-sm line-clamp-2">
                        {req.description || "No description provided."}
                      </p>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-[var(--color-text)]">
                        {req.contactPhone || "Chưa có SĐT"}
                      </div>
                      <div className="text-[11px] text-[var(--color-text-muted)] truncate max-w-xs">
                        {req.address || "Chưa có địa chỉ"}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {req.status === "pending" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                          <Clock className="size-3" />
                          <span>Chờ duyệt</span>
                        </span>
                      )}
                      {req.status === "approved" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          <CheckCircle2 className="size-3" />
                          <span>Đã phê duyệt</span>
                        </span>
                      )}
                      {req.status === "rejected" && (
                        <div>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                            <XCircle className="size-3" />
                            <span>Bị từ chối</span>
                          </span>
                          {req.rejectionReason && (
                            <p className="text-[10px] text-rose-600/80 mt-1 italic max-w-xs">
                              Lý do: {req.rejectionReason}
                            </p>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {req.status === "pending" ? (
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <Button
                            type="button"
                            variant="primary"
                            loading={approveMutation.isPending}
                            onClick={() => void handleApprove(req.id)}
                            className="px-2.5 py-1 text-xs font-bold gap-1"
                          >
                            <Check className="size-3.5" />
                            <span>Phê duyệt</span>
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setRejectingItem(req)}
                            className="px-2.5 py-1 text-xs font-bold gap-1 text-[var(--color-effort)] hover:bg-[var(--color-effort-soft)]"
                          >
                            <X className="size-3.5" />
                            <span>Từ chối</span>
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-[var(--color-text-dim)]">Đã xử lý</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-neutral-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-neutral-900 text-sm">
                Từ chối yêu cầu: {rejectingItem.brandName}
              </h3>
              <button
                type="button"
                onClick={() => setRejectingItem(null)}
                className="size-7 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-700">
                Lý do từ chối đơn đăng ký:
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Nhập lý do (ví dụ: Thiếu hồ sơ pháp lý, số điện thoại không liên lạc được...)"
                className="w-full p-2.5 text-xs rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-neutral-900 placeholder:text-neutral-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setRejectingItem(null)}
                className="text-xs"
              >
                Hủy
              </Button>
              <Button
                type="button"
                variant="danger"
                loading={rejectMutation.isPending}
                onClick={() => void handleConfirmReject()}
                className="text-xs font-bold"
              >
                Xác nhận từ chối
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
