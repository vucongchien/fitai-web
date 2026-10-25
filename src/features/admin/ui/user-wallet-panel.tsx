"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDownRight,
  ArrowUpRight,
  Coins,
  History,
  Loader2,
  RefreshCw,
  Sliders,
  X,
} from "lucide-react";
import { useState } from "react";

import {
  adminAdjustUserCoins,
  fetchUserTransactions,
  fetchUserWallet,
} from "@/features/admin/api/admin-gamification-service";

interface UserWalletPanelProps {
  userId: string;
}

export function UserWalletPanel({ userId }: UserWalletPanelProps) {
  const queryClient = useQueryClient();
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [amountInput, setAmountInput] = useState<string>("50");
  const [reasonInput, setReasonInput] = useState<string>("COMPENSATION");
  const [noteInput, setNoteInput] = useState<string>("");
  const [feedbackMsg, setFeedbackMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // 1. Query Wallet Balance
  const {
    data: wallet,
    isLoading: isWalletLoading,
    refetch: refetchWallet,
  } = useQuery({
    queryKey: ["user-wallet", userId],
    queryFn: () => fetchUserWallet(userId),
    enabled: !!userId,
  });

  // 2. Query Transactions Ledger
  const {
    data: txResponse,
    isLoading: isTxLoading,
    refetch: refetchTx,
  } = useQuery({
    queryKey: ["user-transactions", userId],
    queryFn: () => fetchUserTransactions(userId, 50),
    enabled: !!userId,
  });

  // 3. Mutation for Adjusting Coins
  const adjustMutation = useMutation({
    mutationFn: adminAdjustUserCoins,
    onSuccess: (res) => {
      setFeedbackMsg({
        type: "success",
        text: `Điều chỉnh thành công! Số dư mới: ${res.balanceAfter.toLocaleString()} FitCoins`,
      });
      setIsAdjustModalOpen(false);
      setNoteInput("");
      queryClient.invalidateQueries({ queryKey: ["user-wallet", userId] });
      queryClient.invalidateQueries({ queryKey: ["user-transactions", userId] });
    },
    onError: (err: any) => {
      setFeedbackMsg({
        type: "error",
        text: err?.message || "Lỗi khi thực hiện điều chỉnh số dư",
      });
    },
  });

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMsg(null);
    const parsedAmount = parseInt(amountInput, 10);
    if (isNaN(parsedAmount) || parsedAmount === 0) {
      setFeedbackMsg({ type: "error", text: "Số lượng xu điều chỉnh phải khác 0" });
      return;
    }
    adjustMutation.mutate({
      targetUserId: userId,
      amount: parsedAmount,
      reason: reasonInput,
      note: noteInput.trim() || undefined,
    });
  };

  const handleRefreshAll = () => {
    refetchWallet();
    refetchTx();
  };

  return (
    <div className="space-y-4">
      {/* Wallet Card Hero */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-[var(--radius-card)] bg-[var(--color-surface-subtle)] border border-[var(--color-border)] gap-4">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-[var(--radius-input)] bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
            <Coins className="size-6" />
          </div>
          <div>
            <span className="text-xs text-[var(--color-text-muted)] font-medium">
              Số dư Ví FitCoins
            </span>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-black text-[var(--color-text)] font-mono">
                {isWalletLoading ? (
                  <Loader2 className="size-5 animate-spin inline-block text-[var(--color-action)]" />
                ) : (
                  (wallet?.balance || 0).toLocaleString()
                )}
              </h3>
              <span className="text-xs font-bold text-amber-500">FitCoins</span>
            </div>
            {wallet?.updatedAt && (
              <p className="text-[10px] text-[var(--color-text-dim)]">
                Cập nhật lần cuối: {new Date(wallet.updatedAt).toLocaleTimeString("vi-VN")}{" "}
                {new Date(wallet.updatedAt).toLocaleDateString("vi-VN")}
              </p>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            title="Làm mới dữ liệu"
            onClick={handleRefreshAll}
            className="p-2 rounded-[var(--radius-input)] border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors cursor-pointer"
          >
            <RefreshCw className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setFeedbackMsg(null);
              setIsAdjustModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-[var(--radius-input)] bg-[var(--color-action)] hover:bg-[var(--color-action)]/90 text-[var(--color-action-contrast)] text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Sliders className="size-3.5" />
            <span>Điều chỉnh số dư</span>
          </button>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedbackMsg && (
        <div
          className={`p-3 rounded-[var(--radius-input)] text-xs font-medium border flex items-center justify-between ${
            feedbackMsg.type === "success"
              ? "bg-[var(--color-recovery-soft)] text-[var(--color-recovery)] border-[var(--color-recovery)]/30"
              : "bg-[var(--color-effort-soft)] text-[var(--color-effort)] border-[var(--color-effort)]/30"
          }`}
        >
          <span>{feedbackMsg.text}</span>
          <button
            type="button"
            onClick={() => setFeedbackMsg(null)}
            className="size-4 text-current opacity-70 hover:opacity-100 cursor-pointer"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* Adjust Modal Dialog */}
      {isAdjustModalOpen && (
        <div className="p-4 rounded-[var(--radius-card)] bg-[var(--color-surface)] border-2 border-[var(--color-action)]/30 shadow-lg space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text)] flex items-center gap-1.5">
              <Sliders className="size-3.5 text-[var(--color-action)]" />
              <span>Điều chỉnh FitCoins cấp Admin</span>
            </h4>
            <button
              type="button"
              onClick={() => setIsAdjustModalOpen(false)}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>

          <form onSubmit={handleAdjustSubmit} className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[var(--color-text-muted)] mb-1">
                  Số lượng xu (Dương = Cộng, Âm = Trừ)
                </label>
                <input
                  type="number"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  placeholder="VD: 50 hoặc -20"
                  className="w-full px-3 py-2 rounded-[var(--radius-input)] bg-[var(--color-surface-subtle)] border border-[var(--color-border)] text-[var(--color-text)] font-mono text-xs focus:outline-none focus:border-[var(--color-action)]"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--color-text-muted)] mb-1">
                  Lý do giao dịch
                </label>
                <select
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-[var(--radius-input)] bg-[var(--color-surface-subtle)] border border-[var(--color-border)] text-[var(--color-text)] text-xs focus:outline-none focus:border-[var(--color-action)]"
                >
                  <option value="COMPENSATION">COMPENSATION (Bồi hoàn sự cố/Lỗi app)</option>
                  <option value="ADMIN_ADJUST">ADMIN_ADJUST (Điều chỉnh nghiệp vụ khác)</option>
                  <option value="EVENT_REWARD">EVENT_REWARD (Thưởng sự kiện đặc biệt)</option>
                  <option value="FRAUD_REVOCATION">FRAUD_REVOCATION (Thu hồi do gian lận)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[var(--color-text-muted)] mb-1">
                Ghi chú chi tiết (Audit Note)
              </label>
              <input
                type="text"
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="VD: Đền bù do người dùng gặp lỗi gián đoạn buổi tập ngày 25/10"
                className="w-full px-3 py-2 rounded-[var(--radius-input)] bg-[var(--color-surface-subtle)] border border-[var(--color-border)] text-[var(--color-text)] text-xs focus:outline-none focus:border-[var(--color-action)]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAdjustModalOpen(false)}
                className="px-3 py-1.5 rounded-[var(--radius-input)] text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[var(--color-surface-subtle)] cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={adjustMutation.isPending}
                className="px-4 py-1.5 rounded-[var(--radius-input)] bg-[var(--color-action)] hover:bg-[var(--color-action)]/90 text-[var(--color-action-contrast)] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {adjustMutation.isPending && <Loader2 className="size-3 animate-spin" />}
                <span>Xác nhận điều chỉnh</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Transactions Ledger Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-dim)] flex items-center gap-1.5">
            <History className="size-3.5 text-[var(--color-action)]" />
            <span>Sổ cái Giao dịch FitCoins ({txResponse?.entries?.length || 0})</span>
          </h4>
        </div>

        {isTxLoading ? (
          <div className="p-8 text-center text-xs text-[var(--color-text-muted)] flex items-center justify-center gap-2">
            <Loader2 className="size-4 animate-spin text-[var(--color-action)]" />
            <span>Đang tải sổ cái giao dịch...</span>
          </div>
        ) : !txResponse?.entries || txResponse.entries.length === 0 ? (
          <div className="p-6 rounded-[var(--radius-input)] bg-[var(--color-surface-subtle)] border border-[var(--color-border)] text-center text-xs text-[var(--color-text-muted)] italic">
            Chưa có giao dịch biến động FitCoins nào được ghi nhận.
          </div>
        ) : (
          <div className="border border-[var(--color-border)] rounded-[var(--radius-input)] overflow-hidden">
            <div className="max-h-60 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[var(--color-surface-subtle)] border-b border-[var(--color-border)] sticky top-0 z-10 text-[11px] font-bold text-[var(--color-text-dim)] uppercase">
                  <tr>
                    <th className="p-2.5">Thời gian</th>
                    <th className="p-2.5 text-right">Biến động</th>
                    <th className="p-2.5 text-right">Số dư sau</th>
                    <th className="p-2.5">Lý do</th>
                    <th className="p-2.5">Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)] font-mono text-[11px]">
                  {txResponse.entries.map((tx) => {
                    const isPositive = tx.amount > 0;
                    return (
                      <tr
                        key={tx.id}
                        className="hover:bg-[var(--color-surface-subtle)]/50 transition-colors"
                      >
                        <td className="p-2.5 text-[var(--color-text-muted)] whitespace-nowrap">
                          {new Date(tx.createdAt).toLocaleDateString("vi-VN", {
                            month: "2-digit",
                            day: "2-digit",
                          })}{" "}
                          {new Date(tx.createdAt).toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="p-2.5 text-right whitespace-nowrap font-bold">
                          <span
                            className={`inline-flex items-center gap-0.5 ${
                              isPositive
                                ? "text-[var(--color-recovery)]"
                                : "text-[var(--color-effort)]"
                            }`}
                          >
                            {isPositive ? (
                              <ArrowUpRight className="size-3" />
                            ) : (
                              <ArrowDownRight className="size-3" />
                            )}
                            {isPositive
                              ? `+${tx.amount.toLocaleString()}`
                              : tx.amount.toLocaleString()}
                          </span>
                        </td>
                        <td className="p-2.5 text-right font-semibold text-[var(--color-text)]">
                          {tx.balanceAfter.toLocaleString()}
                        </td>
                        <td className="p-2.5 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-[var(--radius-input)] text-[10px] font-bold bg-[var(--color-surface-subtle)] border border-[var(--color-border)] text-[var(--color-text)]">
                            {tx.reason}
                          </span>
                        </td>
                        <td
                          className="p-2.5 text-[var(--color-text-muted)] max-w-xs truncate"
                          title={tx.note || ""}
                        >
                          {tx.note || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
