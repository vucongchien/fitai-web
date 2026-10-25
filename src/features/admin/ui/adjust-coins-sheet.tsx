"use client";

import { Loader2, Sparkles, X } from "lucide-react";
import { useState } from "react";

interface AdjustCoinsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (amount: number, reason: string, note?: string) => void;
  isPending: boolean;
}

export function AdjustCoinsSheet({ isOpen, onClose, onSubmit, isPending }: AdjustCoinsSheetProps) {
  const [amountInput, setAmountInput] = useState<string>("50");
  const [reasonInput, setReasonInput] = useState<string>("COMPENSATION");
  const [noteInput, setNoteInput] = useState<string>("");
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    const amount = parseInt(amountInput, 10);
    if (isNaN(amount) || amount === 0) {
      setValidationError("Vui lòng nhập số lượng xu hợp lệ khác 0 (dương để cộng, âm để trừ)");
      return;
    }
    onSubmit(amount, reasonInput, noteInput.trim() || undefined);
  };

  return (
    <div className="p-4 rounded-xl border border-neutral-200/80 bg-neutral-50/70 shadow-xs space-y-3 animate-in fade-in duration-150">
      <div className="flex items-center justify-between pb-2 border-b border-neutral-200/60">
        <h4 className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
          <Sparkles className="size-3.5 text-amber-500" />
          <span>Điều chỉnh số dư FitCoins</span>
        </h4>
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng form điều chỉnh"
          className="size-6 rounded-md hover:bg-neutral-200/60 text-neutral-400 hover:text-neutral-700 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="size-3.5" />
        </button>
      </div>

      {validationError && (
        <div className="p-2.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          {validationError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-2.5 text-xs">
        <div>
          <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
            Số lượng xu (nhập số âm nếu muốn trừ)
          </label>
          <input
            type="number"
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            placeholder="VD: 50 hoặc -20"
            className="w-full px-3 py-2 rounded-lg bg-white border border-neutral-200 text-neutral-900 font-mono text-xs focus:outline-none focus:border-neutral-400"
            required
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
            Lý do nghiệp vụ
          </label>
          <select
            value={reasonInput}
            onChange={(e) => setReasonInput(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white border border-neutral-200 text-neutral-900 text-xs focus:outline-none focus:border-neutral-400 cursor-pointer"
          >
            <option value="COMPENSATION">COMPENSATION (Bồi hoàn sự cố ứng dụng)</option>
            <option value="ADMIN_ADJUST">ADMIN_ADJUST (Điều chỉnh nghiệp vụ quản trị)</option>
            <option value="EVENT_REWARD">EVENT_REWARD (Thưởng sự kiện & thành tích)</option>
            <option value="FRAUD_REVOCATION">FRAUD_REVOCATION (Thu hồi do gian lận)</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
            Ghi chú kiểm toán (Audit Note)
          </label>
          <input
            type="text"
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            placeholder="VD: Bồi hoàn sự cố ngày 25/10"
            className="w-full px-3 py-2 rounded-lg bg-white border border-neutral-200 text-neutral-900 text-xs focus:outline-none focus:border-neutral-400"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200/60">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/50 cursor-pointer font-semibold transition-colors"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
          >
            {isPending && <Loader2 className="size-3 animate-spin" />}
            <span>Xác nhận điều chỉnh</span>
          </button>
        </div>
      </form>
    </div>
  );
}
