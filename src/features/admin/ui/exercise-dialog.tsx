"use client";

import { Check, Dumbbell, X } from "lucide-react";
import { useEffect, useId, useState } from "react";

import type { AdminExercise, AdminExerciseStatus } from "@/features/admin/domain/admin-types";
import type { Difficulty } from "@/features/exercise/domain/exercise";

export type ExerciseDialogMode = "create" | "edit" | "view";

type MetadataOption = { id: string; name: string };

/**
 * Fallback catalogs live at module scope so they keep a stable identity across
 * renders. As inline default values they were re-created on every render, and
 * because they feed the reset effect's dependency array below that made the
 * effect re-run on every render — wiping the form while the user typed.
 */
const DEFAULT_BODY_PARTS: MetadataOption[] = [
  { id: "bp-chest", name: "Ngực (Chest)" },
  { id: "bp-back", name: "Lưng (Back)" },
  { id: "bp-legs", name: "Chân (Legs)" },
  { id: "bp-shoulders", name: "Vai (Shoulders)" },
  { id: "bp-arms", name: "Tay (Arms)" },
  { id: "bp-core", name: "Bụng (Core)" },
];

const DEFAULT_EQUIPMENTS: MetadataOption[] = [
  { id: "eq-bodyweight", name: "Bodyweight (Trọng lượng cơ thể)" },
  { id: "eq-dumbbell", name: "Dumbbell (Tạ đơn)" },
  { id: "eq-barbell", name: "Barbell (Tạ đòn)" },
  { id: "eq-kettlebell", name: "Kettlebell (Tạ ấm)" },
  { id: "eq-cable", name: "Cable (Máy kéo cáp)" },
  { id: "eq-machine", name: "Machine (Máy tập)" },
];

const DEFAULT_MUSCLES: MetadataOption[] = [
  { id: "ms-pectoralis-major", name: "Cơ ngực lớn" },
  { id: "ms-latissimus-dorsi", name: "Cơ xô (Lats)" },
  { id: "ms-quadriceps", name: "Cơ đùi trước" },
  { id: "ms-biceps", name: "Cơ tay trước" },
  { id: "ms-triceps", name: "Cơ tay sau" },
];

export type ExerciseDialogProps = {
  isOpen: boolean;
  mode: ExerciseDialogMode;
  exercise?: AdminExercise | null;
  onClose: () => void;
  onSave?: (data: Partial<AdminExercise>) => Promise<void>;
  bodyParts?: { id: string; name: string }[];
  equipments?: { id: string; name: string }[];
  muscles?: { id: string; name: string }[];
};

export function ExerciseDialog({
  isOpen,
  mode,
  exercise,
  onClose,
  onSave,
  bodyParts = DEFAULT_BODY_PARTS,
  equipments = DEFAULT_EQUIPMENTS,
  muscles = DEFAULT_MUSCLES,
}: ExerciseDialogProps) {
  const fieldIdBase = useId();
  const [formData, setFormData] = useState<Partial<AdminExercise>>({
    name: "",
    bodyPartId: bodyParts[0]?.id || "",
    equipmentId: equipments[0]?.id || "",
    targetMuscleId: muscles[0]?.id || "",
    secondaryMuscleIds: [],
    difficulty: "beginner",
    defaultRestSeconds: 60,
    instructions: "",
    formCues: [],
    commonMistakes: [],
    status: "created",
    hasAiSupported: false,
    createdBy: "admin@fitai.com",
  });
  const [formCuesText, setFormCuesText] = useState("");
  const [commonMistakesText, setCommonMistakesText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (exercise && (mode === "edit" || mode === "view")) {
      setFormData(exercise);
      setFormCuesText(exercise.formCues?.join("\n") || "");
      setCommonMistakesText(exercise.commonMistakes?.join("\n") || "");
    } else {
      setFormData({
        name: "",
        bodyPartId: bodyParts[0]?.id || "bp-chest",
        equipmentId: equipments[0]?.id || "eq-bodyweight",
        targetMuscleId: muscles[0]?.id || "ms-pectoralis-major",
        secondaryMuscleIds: [],
        difficulty: "beginner",
        defaultRestSeconds: 60,
        instructions: "",
        status: "created",
        hasAiSupported: false,
        createdBy: "admin@fitai.com",
      });
      setFormCuesText("");
      setCommonMistakesText("");
    }
  }, [exercise, mode, bodyParts, equipments, muscles, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSave || mode === "view") return;

    setIsSubmitting(true);
    try {
      const payload: Partial<AdminExercise> = {
        ...formData,
        formCues: formCuesText
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        commonMistakes: commonMistakesText
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
      };
      await onSave(payload);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const isReadOnly = mode === "view";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Dumbbell className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100">
                {mode === "create" && "Thêm Bài tập mới"}
                {mode === "edit" && "Chỉnh sửa Bài tập"}
                {mode === "view" && "Chi tiết Bài tập"}
              </h2>
              <p className="text-xs text-zinc-400">
                {mode === "view" ? `ID: ${exercise?.id}` : "Điền đầy đủ thông tin bài tập bên dưới"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-8 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Modal Body (Scrollable Large Modal) */}
        <form
          id="exercise-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-5"
        >
          {/* Row 1: Name & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300" htmlFor={`${fieldIdBase}-1`}>
                Tên bài tập *
              </label>
              <input
                id={`${fieldIdBase}-1`}
                type="text"
                required
                disabled={isReadOnly}
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="VD: Incline Dumbbell Press"
                className="w-full px-3.5 py-2.5 text-xs bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl text-zinc-100 placeholder:text-zinc-600 focus:outline-none disabled:opacity-70 disabled:bg-zinc-900/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300" htmlFor={`${fieldIdBase}-2`}>
                Trạng thái (Status)
              </label>
              <select
                id={`${fieldIdBase}-2`}
                disabled={isReadOnly}
                value={formData.status || "created"}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as AdminExerciseStatus })
                }
                className="w-full px-3.5 py-2.5 text-xs bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl text-zinc-100 focus:outline-none disabled:opacity-70 disabled:bg-zinc-900/50 cursor-pointer"
              >
                <option value="created">Draft (Mới tạo)</option>
                <option value="submittedForApproval">Chờ duyệt</option>
                <option value="approved">Đã duyệt</option>
                <option value="archived">Đã lưu trữ</option>
              </select>
            </div>
          </div>

          {/* Row 2: BodyPart, Equipment, Muscle, Difficulty */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300" htmlFor={`${fieldIdBase}-3`}>
                Nhóm cơ chính *
              </label>
              <select
                id={`${fieldIdBase}-3`}
                disabled={isReadOnly}
                value={formData.bodyPartId || ""}
                onChange={(e) => setFormData({ ...formData, bodyPartId: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl text-zinc-100 focus:outline-none disabled:opacity-70 cursor-pointer"
              >
                {bodyParts.map((bp) => (
                  <option key={bp.id} value={bp.id}>
                    {bp.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300" htmlFor={`${fieldIdBase}-4`}>
                Dụng cụ *
              </label>
              <select
                id={`${fieldIdBase}-4`}
                disabled={isReadOnly}
                value={formData.equipmentId || ""}
                onChange={(e) => setFormData({ ...formData, equipmentId: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl text-zinc-100 focus:outline-none disabled:opacity-70 cursor-pointer"
              >
                {equipments.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300" htmlFor={`${fieldIdBase}-5`}>
                Cơ mục tiêu *
              </label>
              <select
                id={`${fieldIdBase}-5`}
                disabled={isReadOnly}
                value={formData.targetMuscleId || ""}
                onChange={(e) => setFormData({ ...formData, targetMuscleId: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl text-zinc-100 focus:outline-none disabled:opacity-70 cursor-pointer"
              >
                {muscles.map((ms) => (
                  <option key={ms.id} value={ms.id}>
                    {ms.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300" htmlFor={`${fieldIdBase}-6`}>
                Độ khó *
              </label>
              <select
                id={`${fieldIdBase}-6`}
                disabled={isReadOnly}
                value={formData.difficulty || "beginner"}
                onChange={(e) =>
                  setFormData({ ...formData, difficulty: e.target.value as Difficulty })
                }
                className="w-full px-3 py-2 text-xs bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl text-zinc-100 focus:outline-none disabled:opacity-70 cursor-pointer"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          {/* Row 3: Rest Seconds & AI Support */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300" htmlFor={`${fieldIdBase}-7`}>
                Thời gian nghỉ mặc định (Giây)
              </label>
              <input
                id={`${fieldIdBase}-7`}
                type="number"
                disabled={isReadOnly}
                value={formData.defaultRestSeconds ?? 60}
                onChange={(e) =>
                  setFormData({ ...formData, defaultRestSeconds: Number(e.target.value) })
                }
                className="w-full px-3.5 py-2 text-xs bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl text-zinc-100 focus:outline-none disabled:opacity-70"
              />
            </div>

            <div className="flex items-center gap-3 pt-6">
              <label className="flex items-center gap-2 text-xs font-semibold text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={isReadOnly}
                  checked={formData.hasAiSupported || false}
                  onChange={(e) => setFormData({ ...formData, hasAiSupported: e.target.checked })}
                  className="size-4 rounded accent-amber-500 bg-zinc-900 border-zinc-800 cursor-pointer"
                />
                <span>Hỗ trợ Camera AI phân tích Form</span>
              </label>
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300" htmlFor={`${fieldIdBase}-8`}>
              Hướng dẫn thực hiện
            </label>
            <textarea
              id={`${fieldIdBase}-8`}
              rows={3}
              disabled={isReadOnly}
              value={formData.instructions || ""}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              placeholder="Mô tả các bước thực hiện bài tập chi tiết..."
              className="w-full px-3.5 py-2.5 text-xs bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl text-zinc-100 placeholder:text-zinc-600 focus:outline-none disabled:opacity-70"
            />
          </div>

          {/* Form Cues & Common Mistakes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300" htmlFor={`${fieldIdBase}-9`}>
                Gợi ý kỹ thuật (Form Cues - 1 câu/dòng)
              </label>
              <textarea
                id={`${fieldIdBase}-9`}
                rows={3}
                disabled={isReadOnly}
                value={formCuesText}
                onChange={(e) => setFormCuesText(e.target.value)}
                placeholder="VD: Siết chặt cơ bụng&#10;Hạ tạ có kiểm soát"
                className="w-full px-3.5 py-2.5 text-xs bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl text-zinc-100 placeholder:text-zinc-600 focus:outline-none disabled:opacity-70"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300" htmlFor={`${fieldIdBase}-10`}>
                Lỗi thường gặp (1 câu/dòng)
              </label>
              <textarea
                id={`${fieldIdBase}-10`}
                rows={3}
                disabled={isReadOnly}
                value={commonMistakesText}
                onChange={(e) => setCommonMistakesText(e.target.value)}
                placeholder="VD: Võng lưng quá mức&#10;Gồng vai quá đà"
                className="w-full px-3.5 py-2.5 text-xs bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl text-zinc-100 placeholder:text-zinc-600 focus:outline-none disabled:opacity-70"
              />
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-800/80 bg-zinc-900/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium border border-zinc-700 transition-colors cursor-pointer"
          >
            {isReadOnly ? "Đóng" : "Hủy"}
          </button>
          {!isReadOnly && (
            <button
              type="submit"
              form="exercise-form"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-zinc-950 text-xs font-bold shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Check className="size-4" />
              <span>{isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
