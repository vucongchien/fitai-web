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
import { AdjustCoinsSheet } from "@/features/admin/ui/adjust-coins-sheet";

interface UserWalletPanelProps {
  userId: string;
}

export function UserWalletPanel({ userId }: UserWalletPanelProps) {
  const queryClient = useQueryClient();
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const {
    data: wallet,
    isLoading: isWalletLoading,
    refetch: refetchWallet,
  } = useQuery({
    queryKey: ["user-wallet", userId],
    queryFn: () => fetchUserWallet(userId),
    enabled: !!userId,
  });

  const {
    data: txResponse,
    isLoading: isTxLoading,
    refetch: refetchTx,
  } = useQuery({
    queryKey: ["user-transactions", userId],
    queryFn: () => fetchUserTransactions(userId, 50),
    enabled: !!userId,
  });

  const adjustMutation = useMutation({
    mutationFn: adminAdjustUserCoins,
    onSuccess: (res) => {
      setFeedbackMsg({
        type: "success",
        text: `Đã điều chỉnh thành công! Số dư mới: ${res.balanceAfter.toLocaleString()} FitCoins`,
      });
      setIsAdjustOpen(false);
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

  const handleAdjustSubmit = (amount: number, reason: string, note?: string) => {
    setFeedbackMsg(null);
    adjustMutation.mutate({
      targetUserId: userId,
      amount,
      reason,
      note,
    });
  };

  const handleRefreshAll = () => {
    refetchWallet();
    refetchTx();
  };

  const renderReasonBadge = (reason: string) => {
    switch (reason) {
      case "COMPENSATION":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/60">
            COMPENSATION
          </span>
        );
      case "EVENT_REWARD":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
            EVENT_REWARD
          </span>
        );
      case "FRAUD_REVOCATION":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/60">
            FRAUD_REVOCATION
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200/60">
            {reason || "ADMIN_ADJUST"}
          </span>
        );
    }
  };

  return (
    <div className="space-y-3">
      {/* FitCoins Hero Stat Card */}
      <div className="p-3.5 rounded-xl border border-amber-200/70 bg-amber-50/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Coins className="size-4 text-amber-600" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
              Số Dư FitCoins
            </span>
          </div>
          <button
            type="button"
            title="Làm mới sổ cái"
            onClick={handleRefreshAll}
            className="size-6 rounded-md bg-white border border-neutral-200/80 hover:bg-neutral-50 text-neutral-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <RefreshCw className="size-3" />
          </button>
        </div>

        <div className="flex items-baseline justify-between pt-0.5">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-neutral-900 tracking-tight font-sans">
                {isWalletLoading ? (
                  <Loader2 className="size-5 animate-spin text-amber-500 inline-block" />
                ) : (
                  (wallet?.balance || 0).toLocaleString()
                )}
              </span>
              <span className="text-xs font-semibold text-amber-800">FitCoins</span>
            </div>
            {wallet?.updatedAt && (
              <p className="text-[10px] text-neutral-400 pt-0.5">
                Cập nhật:{" "}
                {new Date(wallet.updatedAt).toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                · {new Date(wallet.updatedAt).toLocaleDateString("vi-VN")}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setFeedbackMsg(null);
              setIsAdjustOpen((prev) => !prev);
            }}
            className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <Sliders className="size-3 text-neutral-300" />
            <span>{isAdjustOpen ? "Đóng form" : "Điều chỉnh"}</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast Alert */}
      {feedbackMsg && (
        <div
          className={`p-2.5 rounded-lg text-xs font-semibold flex items-center justify-between border ${
            feedbackMsg.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200/80"
              : "bg-rose-50 text-rose-800 border-rose-200/80"
          }`}
        >
          <span>{feedbackMsg.text}</span>
          <button
            type="button"
            onClick={() => setFeedbackMsg(null)}
            className="size-4 text-current opacity-70 hover:opacity-100 cursor-pointer ml-2"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* Collapsible Adjustment Sheet Component */}
      <AdjustCoinsSheet
        isOpen={isAdjustOpen}
        onClose={() => setIsAdjustOpen(false)}
        onSubmit={handleAdjustSubmit}
        isPending={adjustMutation.isPending}
      />

      {/* Activity Feed Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-0.5">
          <div className="flex items-center gap-1.5">
            <History className="size-3.5 text-neutral-400" />
            <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
              Lịch sử biến động xu
            </h4>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-100 text-neutral-600">
            {txResponse?.entries?.length || 0} bản ghi
          </span>
        </div>

        {isTxLoading ? (
          <div className="p-8 text-center text-xs text-neutral-400 flex items-center justify-center gap-2 bg-neutral-50/50 rounded-xl border border-neutral-200/60">
            <Loader2 className="size-4 animate-spin text-amber-500" />
            <span>Đang tải sổ cái...</span>
          </div>
        ) : !txResponse?.entries || txResponse.entries.length === 0 ? (
          <div className="p-6 text-center space-y-1 bg-neutral-50/50 rounded-xl border border-neutral-200/60">
            <Coins className="size-5 text-amber-400 mx-auto" />
            <p className="text-xs font-semibold text-neutral-700">Chưa có giao dịch</p>
            <p className="text-[11px] text-neutral-400">
              Các biến động FitCoins của thành viên sẽ hiển thị tại đây.
            </p>
          </div>
        ) : (
          <div className="max-h-[260px] overflow-y-auto space-y-1.5 pr-0.5">
            {txResponse.entries.map((tx) => {
              const isPositive = tx.amount > 0;
              return (
                <div
                  key={tx.id}
                  className="p-2.5 rounded-xl border border-neutral-200/60 bg-white hover:bg-neutral-50 transition-colors flex items-center justify-between gap-2.5 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`size-6 rounded-md flex items-center justify-center shrink-0 ${
                        isPositive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                      }`}
                    >
                      {isPositive ? (
                        <ArrowUpRight className="size-3.5" />
                      ) : (
                        <ArrowDownRight className="size-3.5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {renderReasonBadge(tx.reason)}
                        {tx.note && (
                          <span
                            className="text-[11px] text-neutral-500 truncate max-w-[130px]"
                            title={tx.note}
                          >
                            {tx.note}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-neutral-400 pt-0.5 font-mono">
                        {new Date(tx.createdAt).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        · {new Date(tx.createdAt).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={`font-semibold font-mono text-xs ${
                        isPositive ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {isPositive ? `+${tx.amount.toLocaleString()}` : tx.amount.toLocaleString()}{" "}
                      xu
                    </div>
                    <div className="text-[10px] text-neutral-400 font-mono">
                      Sau: {tx.balanceAfter.toLocaleString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
