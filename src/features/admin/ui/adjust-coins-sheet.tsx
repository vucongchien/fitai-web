"use client";

import { Loader2, Minus, Plus, Sparkles, X } from "lucide-react";
import { useState } from "react";

interface AdjustCoinsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (amount: number, reason: string, note?: string) => void;
  isPending: boolean;
}

const PRESET_AMOUNTS = [10, 20, 50, 100];

export function AdjustCoinsSheet({ isOpen, onClose, onSubmit, isPending }: AdjustCoinsSheetProps) {
  const [amountSign, setAmountSign] = useState<"+" | "-">("+");
  const [amountMagnitude, setAmountMagnitude] = useState<string>("50");
  const [reasonInput, setReasonInput] = useState<string>("COMPENSATION");
  const [noteInput, setNoteInput] = useState<string>("");
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    const magnitude = parseInt(amountMagnitude, 10);
    if (isNaN(magnitude) || magnitude <= 0) {
      setValidationError("Vui lòng nhập số lượng xu hợp lệ lớn hơn 0");
      return;
    }
    const signedAmount = amountSign === "-" ? -magnitude : magnitude;
    onSubmit(signedAmount, reasonInput, noteInput.trim() || undefined);
  };

  const applyPreset = (val: number, sign: "+" | "-") => {
    setAmountSign(sign);
    setAmountMagnitude(String(val));
    setValidationError(null);
  };

  return (
    <div className="p-5 rounded-2xl bg-white border-2 border-amber-300 shadow-lg space-y-4 animate-in fade-in slide-in-from-top-2 duration-150">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-amber-500" />
            <span>Điều chỉnh FitCoins cấp Admin</span>
          </h4>
          <p className="text-[11px] text-slate-500 pt-0.5">
            Mọi thay đổi đều được mã hóa vào sổ cái PostgreSQL với chữ ký kiểm toán.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 cursor-pointer"
        >
          <X className="size-4" />
        </button>
      </div>

      {validationError && (
        <div className="p-2.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          {validationError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
        <div>
          <span className="block text-[11px] font-bold text-slate-600 mb-1.5">
            Chọn nhanh hạn mức xu:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_AMOUNTS.map((val) => (
              <button
                key={`plus-${val}`}
                type="button"
                onClick={() => applyPreset(val, "+")}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors cursor-pointer"
              >
                +{val} xu
              </button>
            ))}
            {PRESET_AMOUNTS.slice(0, 3).map((val) => (
              <button
                key={`minus-${val}`}
                type="button"
                onClick={() => applyPreset(val, "-")}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
              >
                -{val} xu
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Số lượng xu & Chiều biến động
            </label>
            <div className="flex items-center gap-1.5">
              <div className="inline-flex rounded-xl p-0.5 bg-slate-100 border border-slate-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setAmountSign("+")}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-0.5 cursor-pointer transition-colors ${
                    amountSign === "+"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Plus className="size-3" />
                  Cộng
                </button>
                <button
                  type="button"
                  onClick={() => setAmountSign("-")}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-0.5 cursor-pointer transition-colors ${
                    amountSign === "-"
                      ? "bg-rose-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Minus className="size-3" />
                  Trừ
                </button>
              </div>
              <input
                type="number"
                min="1"
                value={amountMagnitude}
                onChange={(e) => setAmountMagnitude(e.target.value)}
                placeholder="VD: 50"
                className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono text-xs focus:outline-none focus:border-amber-500 focus:bg-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Lý do nghiệp vụ
            </label>
            <select
              value={reasonInput}
              onChange={(e) => setReasonInput(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-amber-500 focus:bg-white cursor-pointer"
            >
              <option value="COMPENSATION">COMPENSATION (Bồi hoàn sự cố ứng dụng)</option>
              <option value="ADMIN_ADJUST">ADMIN_ADJUST (Điều chỉnh nghiệp vụ quản trị)</option>
              <option value="EVENT_REWARD">EVENT_REWARD (Thưởng sự kiện & thành tích)</option>
              <option value="FRAUD_REVOCATION">FRAUD_REVOCATION (Thu hồi do gian lận)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1">
            Ghi chú kiểm toán bắt buộc (Audit Note)
          </label>
          <input
            type="text"
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            placeholder="VD: Đền bù người dùng gặp lỗi gián đoạn bài tập sáng 25/10"
            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-amber-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl text-xs text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 cursor-pointer font-semibold"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
          >
            {isPending && <Loader2 className="size-3 animate-spin" />}
            <span>
              Xác nhận {amountSign === "+" ? "cộng" : "trừ"} {amountMagnitude || "0"} xu
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}
