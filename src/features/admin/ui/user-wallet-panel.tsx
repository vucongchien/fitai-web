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
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-200">
            COMPENSATION
          </span>
        );
      case "EVENT_REWARD":
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            EVENT_REWARD
          </span>
        );
      case "FRAUD_REVOCATION":
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            FRAUD_REVOCATION
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
            {reason || "ADMIN_ADJUST"}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* FitCoins Hero Stat Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 via-amber-50/40 to-orange-50/60 border border-amber-200/90 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="size-13 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/25 shrink-0 ring-4 ring-amber-100">
              <Coins className="size-7" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-800/80">
                Số Dư Khả Dụng
              </span>
              <div className="flex items-baseline gap-2 pt-0.5">
                <h3 className="text-3xl font-black text-slate-900 tracking-tight font-sans">
                  {isWalletLoading ? (
                    <Loader2 className="size-6 animate-spin text-amber-500 inline-block" />
                  ) : (
                    (wallet?.balance || 0).toLocaleString()
                  )}
                </h3>
                <span className="text-xs font-bold text-amber-800 bg-amber-100/90 border border-amber-300/60 px-2.5 py-0.5 rounded-full">
                  FitCoins
                </span>
              </div>
              {wallet?.updatedAt && (
                <p className="text-[11px] text-amber-900/60 pt-0.5">
                  Cập nhật: {new Date(wallet.updatedAt).toLocaleTimeString("vi-VN")}{" "}
                  {new Date(wallet.updatedAt).toLocaleDateString("vi-VN")}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              title="Làm mới sổ cái"
              onClick={handleRefreshAll}
              className="p-2.5 rounded-xl border border-amber-200 bg-white/90 hover:bg-white text-slate-600 hover:text-slate-900 shadow-2xs transition-all cursor-pointer"
            >
              <RefreshCw className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setFeedbackMsg(null);
                setIsAdjustOpen((prev) => !prev);
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-md shadow-amber-500/25 transition-all cursor-pointer active:scale-[0.98]"
            >
              <Sliders className="size-3.5" />
              <span>{isAdjustOpen ? "Đóng form điều chỉnh" : "Điều chỉnh số dư"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Feedback Toast Alert */}
      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold border flex items-center justify-between shadow-xs animate-in fade-in duration-150 ${
            feedbackMsg.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
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

      {/* Ledger Table Section */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <History className="size-4 text-indigo-600" />
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Sổ cái giao dịch
            </h4>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
              {txResponse?.entries?.length || 0} bản ghi
            </span>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Đồng bộ PostgreSQL</span>
          </div>
        </div>

        {isTxLoading ? (
          <div className="p-10 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <Loader2 className="size-4 animate-spin text-amber-500" />
            <span>Đang tải dữ liệu sổ cái...</span>
          </div>
        ) : !txResponse?.entries || txResponse.entries.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <div className="size-10 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto border border-amber-200">
              <Coins className="size-5" />
            </div>
            <p className="text-xs font-bold text-slate-700">Chưa có biến động FitCoins nào</p>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
              Mọi giao dịch thưởng luyện tập, đạt PR, điểm danh hay điều chỉnh của Admin sẽ được lưu
              vết tại đây.
            </p>
          </div>
        ) : (
          <div className="max-h-72 overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/90 border-b border-slate-100 sticky top-0 z-10 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3.5">Thời gian</th>
                  <th className="py-2.5 px-3.5 text-right">Biến động</th>
                  <th className="py-2.5 px-3.5 text-right">Số dư sau</th>
                  <th className="py-2.5 px-3.5">Lý do</th>
                  <th className="py-2.5 px-3.5">Ghi chú kiểm toán</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans text-xs">
                {txResponse.entries.map((tx) => {
                  const isPositive = tx.amount > 0;
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3.5 text-slate-600 whitespace-nowrap">
                        <div className="font-semibold text-slate-800 text-[11px]">
                          {new Date(tx.createdAt).toLocaleDateString("vi-VN", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(tx.createdAt).toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>
                      <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 font-bold text-xs px-2 py-0.5 rounded-lg border ${
                            isPositive
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {isPositive ? (
                            <ArrowUpRight className="size-3 text-emerald-600" />
                          ) : (
                            <ArrowDownRight className="size-3 text-rose-600" />
                          )}
                          {isPositive
                            ? `+${tx.amount.toLocaleString()}`
                            : tx.amount.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-mono font-bold text-slate-800">
                        {tx.balanceAfter.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        {renderReasonBadge(tx.reason)}
                      </td>
                      <td className="py-2.5 px-3.5 text-slate-600 max-w-xs" title={tx.note || ""}>
                        <span className="truncate block text-[11px]">{tx.note || "—"}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
