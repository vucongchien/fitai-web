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
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-violet-50 text-violet-700">
            COMPENSATION
          </span>
        );
      case "EVENT_REWARD":
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700">
            EVENT_REWARD
          </span>
        );
      case "FRAUD_REVOCATION":
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700">
            FRAUD_REVOCATION
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-50 text-sky-700">
            {reason || "ADMIN_ADJUST"}
          </span>
        );
    }
  };

  return (
    <div className="space-y-3.5">
      {/* FitCoins Hero Stat Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 via-amber-500 to-orange-500 p-4 text-white shadow-md shadow-amber-500/15">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
              <Coins className="size-4.5 text-white" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-100">
              Số Dư FitCoins
            </span>
          </div>
          <button
            type="button"
            title="Làm mới sổ cái"
            onClick={handleRefreshAll}
            className="size-7 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors cursor-pointer"
          >
            <RefreshCw className="size-3.5 text-white" />
          </button>
        </div>

        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-3xl font-black tracking-tight font-sans">
              {isWalletLoading ? (
                <Loader2 className="size-6 animate-spin text-white inline-block" />
              ) : (
                (wallet?.balance || 0).toLocaleString()
              )}
            </div>
            {wallet?.updatedAt && (
              <p className="text-[10px] text-amber-100/80 pt-0.5">
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
            className="px-3 py-1.5 rounded-xl bg-white text-amber-900 font-bold text-xs shadow-xs hover:bg-amber-50 inline-flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Sliders className="size-3 text-amber-700" />
            <span>{isAdjustOpen ? "Đóng form" : "Điều chỉnh"}</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast Alert */}
      {feedbackMsg && (
        <div
          className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in duration-150 ${
            feedbackMsg.type === "success"
              ? "bg-emerald-50 text-emerald-800"
              : "bg-rose-50 text-rose-800"
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
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <History className="size-3.5 text-slate-500" />
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Sổ cái giao dịch
            </h4>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
            {txResponse?.entries?.length || 0} bản ghi
          </span>
        </div>

        {isTxLoading ? (
          <div className="p-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2 bg-slate-50/60 rounded-2xl">
            <Loader2 className="size-4 animate-spin text-amber-500" />
            <span>Đang tải sổ cái...</span>
          </div>
        ) : !txResponse?.entries || txResponse.entries.length === 0 ? (
          <div className="p-6 text-center space-y-1.5 bg-slate-50/60 rounded-2xl">
            <Coins className="size-6 text-amber-400 mx-auto" />
            <p className="text-xs font-bold text-slate-700">Chưa có giao dịch</p>
            <p className="text-[11px] text-slate-400">
              Các biến động FitCoins của thành viên sẽ hiển thị tại đây.
            </p>
          </div>
        ) : (
          <div className="max-h-[290px] overflow-y-auto space-y-1.5 pr-0.5">
            {txResponse.entries.map((tx) => {
              const isPositive = tx.amount > 0;
              return (
                <div
                  key={tx.id}
                  className="p-3 rounded-2xl bg-slate-50/80 hover:bg-slate-100/80 transition-colors flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`size-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isPositive
                          ? "bg-emerald-100/80 text-emerald-700"
                          : "bg-rose-100/80 text-rose-700"
                      }`}
                    >
                      {isPositive ? (
                        <ArrowUpRight className="size-4 text-emerald-600" />
                      ) : (
                        <ArrowDownRight className="size-4 text-rose-600" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {renderReasonBadge(tx.reason)}
                        {tx.note && (
                          <span
                            className="text-[11px] text-slate-500 truncate max-w-[140px]"
                            title={tx.note}
                          >
                            {tx.note}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 pt-0.5 font-mono">
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
                      className={`font-bold font-mono text-xs ${
                        isPositive ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {isPositive ? `+${tx.amount.toLocaleString()}` : tx.amount.toLocaleString()}{" "}
                      xu
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
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
