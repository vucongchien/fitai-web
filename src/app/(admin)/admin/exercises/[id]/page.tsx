"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  approveExercise,
  archiveExercise,
  deleteExercise,
  fetchAdminExerciseById,
  fetchMetadataList,
  updateExercise,
} from "@/features/admin/api/admin-exercise-service";
import type { AdminExercise, AdminExerciseStatus, MetadataItem } from "@/features/admin/domain/admin-types";
import { EXERCISE_STATUS_LABEL, EXERCISE_STATUS_STYLE } from "@/features/admin/domain/admin-types";
import type { Difficulty } from "@/features/exercise/domain/exercise";
import {
  Archive,
  ArrowLeft,
  CheckCircle2,
  Dumbbell,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";

export default function AdminExerciseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [exercise, setExercise] = useState<AdminExercise | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [metadata, setMetadata] = useState<MetadataItem[]>([]);

  // Form Fields State
  const [name, setName] = useState("");
  const [status, setStatus] = useState<AdminExerciseStatus>("created");
  const [bodyPartId, setBodyPartId] = useState("");
  const [equipmentId, setEquipmentId] = useState("");
  const [targetMuscleId, setTargetMuscleId] = useState("");
  const [secondaryMuscleIds, setSecondaryMuscleIds] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>("beginner");
  const [defaultRestSeconds, setDefaultRestSeconds] = useState(60);
  const [instructions, setInstructions] = useState("");
  const [formCues, setFormCues] = useState<string[]>([]);
  const [commonMistakes, setCommonMistakes] = useState<string[]>([]);
  const [tagIds, setTagIds] = useState<string[]>([]);

  // New item inputs
  const [newCueInput, setNewCueInput] = useState("");
  const [newMistakeInput, setNewMistakeInput] = useState("");

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [exData, metaList] = await Promise.all([
          fetchAdminExerciseById(id),
          fetchMetadataList(),
        ]);
        setMetadata(metaList);

        if (exData) {
          setExercise(exData);
          setName(exData.name);
          setStatus(exData.status);
          setBodyPartId(exData.bodyPartId);
          setEquipmentId(exData.equipmentId);
          setTargetMuscleId(exData.targetMuscleId);
          setSecondaryMuscleIds(exData.secondaryMuscleIds || []);
          setDifficulty(exData.difficulty);
          setDefaultRestSeconds(exData.defaultRestSeconds);
          setInstructions(exData.instructions || "");
          setFormCues(exData.formCues || []);
          setCommonMistakes(exData.commonMistakes || []);
          setTagIds(exData.tagIds || []);
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-500 space-y-3">
        <Dumbbell className="size-8 animate-bounce text-indigo-600" />
        <p className="text-xs font-semibold">Loading exercise details...</p>
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className="py-16 text-center space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Exercise Not Found</h2>
        <p className="text-xs text-slate-500">The requested exercise with ID `{id}` does not exist.</p>
        <Link
          href="/admin/exercises"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
        >
          <ArrowLeft className="size-4" />
          <span>Back to Catalog</span>
        </Link>
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await updateExercise(id, {
        name,
        status,
        bodyPartId,
        equipmentId,
        targetMuscleId,
        secondaryMuscleIds,
        difficulty,
        defaultRestSeconds,
        instructions,
        formCues,
        commonMistakes,
        tagIds,
      });
      setExercise(updated);
      alert("Exercise updated successfully!");
    } finally {
      setIsSaving(false);
    }
  };

  const handleApprove = async () => {
    const updated = await approveExercise(id);
    setExercise(updated);
    setStatus("approved");
  };

  const handleArchive = async () => {
    const updated = await archiveExercise(id);
    setExercise(updated);
    setStatus("archived");
  };

  const handleDelete = async () => {
    if (confirm(`Delete "${exercise.name}" permanently?`)) {
      await deleteExercise(id);
      router.push("/admin/exercises");
    }
  };

  const addFormCue = () => {
    if (!newCueInput.trim()) return;
    setFormCues([...formCues, newCueInput.trim()]);
    setNewCueInput("");
  };

  const removeFormCue = (index: number) => {
    setFormCues(formCues.filter((_, i) => i !== index));
  };

  const addCommonMistake = () => {
    if (!newMistakeInput.trim()) return;
    setCommonMistakes([...commonMistakes, newMistakeInput.trim()]);
    setNewMistakeInput("");
  };

  const removeCommonMistake = (index: number) => {
    setCommonMistakes(commonMistakes.filter((_, i) => i !== index));
  };

  const bodyPartOptions = metadata.filter((m) => m.category === "bodyPart");
  const equipmentOptions = metadata.filter((m) => m.category === "equipment");
  const muscleOptions = metadata.filter((m) => m.category === "muscle");
  const tagOptions = metadata.filter((m) => m.category === "tag");

  const statusStyle = EXERCISE_STATUS_STYLE[status];

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/admin/exercises"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to Exercise Catalog</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900 font-display">{name}</h1>
            <span
              className={`px-3 py-0.5 rounded-full text-xs font-bold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
            >
              {EXERCISE_STATUS_LABEL[status]}
            </span>
          </div>
        </div>

        {/* Action Header Buttons */}
        <div className="flex items-center gap-2">
          {(status === "created" || status === "submittedForApproval") && (
            <button
              type="button"
              onClick={handleApprove}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition-colors cursor-pointer"
            >
              <CheckCircle2 className="size-4" />
              <span>Approve Entry</span>
            </button>
          )}

          {status !== "archived" && (
            <button
              type="button"
              onClick={handleArchive}
              className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold transition-colors cursor-pointer"
              title="Archive Exercise"
            >
              <Archive className="size-4" />
            </button>
          )}

          <button
            type="button"
            onClick={handleDelete}
            className="p-2 rounded-xl bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 text-xs font-bold transition-colors cursor-pointer"
            title="Delete Exercise"
          >
            <Trash2 className="size-4" />
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="size-4" />
            <span>{isSaving ? "Saving..." : "Save Changes"}</span>
          </button>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Basic Info & Metadata Selects (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Information Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              General Exercise Settings
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-slate-700">Exercise Title *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as AdminExerciseStatus)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all cursor-pointer"
                >
                  <option value="created">Draft</option>
                  <option value="submittedForApproval">Pending Approval</option>
                  <option value="approved">Approved</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Difficulty Level</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all cursor-pointer"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Primary Body Part *</label>
                <select
                  value={bodyPartId}
                  onChange={(e) => setBodyPartId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 focus:outline-none cursor-pointer"
                >
                  {bodyPartOptions.map((bp) => (
                    <option key={bp.id} value={bp.id}>
                      {bp.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Equipment *</label>
                <select
                  value={equipmentId}
                  onChange={(e) => setEquipmentId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 focus:outline-none cursor-pointer"
                >
                  {equipmentOptions.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Target Muscle *</label>
                <select
                  value={targetMuscleId}
                  onChange={(e) => setTargetMuscleId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 focus:outline-none cursor-pointer"
                >
                  {muscleOptions.map((ms) => (
                    <option key={ms.id} value={ms.id}>
                      {ms.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-bold text-slate-700">Default Rest Time (Seconds)</label>
              <input
                type="number"
                value={defaultRestSeconds}
                onChange={(e) => setDefaultRestSeconds(Number(e.target.value))}
                className="w-full max-w-xs px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-900 focus:outline-none"
              />
            </div>
          </div>

          {/* Detailed Instructions Textarea */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900">Step-by-Step Instructions</h3>
            <textarea
              rows={5}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Provide a detailed execution guide for coaches and members..."
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Right Column: Arrays (Form Cues, Common Mistakes, Secondary Muscles, Tags) */}
        <div className="space-y-6">
          {/* Form Cues Array */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
              <span>Form Cues (Array)</span>
              <span className="text-xs text-indigo-600 font-mono">{formCues.length} Cues</span>
            </h3>

            <div className="space-y-2">
              {formCues.map((cue, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between gap-2"
                >
                  <span className="text-slate-800 font-medium">{cue}</span>
                  <button
                    type="button"
                    onClick={() => removeFormCue(idx)}
                    className="text-slate-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <input
                type="text"
                value={newCueInput}
                onChange={(e) => setNewCueInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addFormCue();
                  }
                }}
                placeholder="Add form cue..."
                className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
              <button
                type="button"
                onClick={addFormCue}
                className="p-2 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-bold text-xs transition-colors cursor-pointer"
              >
                <Plus className="size-4" />
              </button>
            </div>
          </div>

          {/* Common Mistakes Array */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
              <span>Common Mistakes (Array)</span>
              <span className="text-xs text-rose-600 font-mono">{commonMistakes.length} Items</span>
            </h3>

            <div className="space-y-2">
              {commonMistakes.map((mistake, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-rose-50/60 border border-rose-100 text-xs flex items-center justify-between gap-2"
                >
                  <span className="text-rose-900 font-medium">{mistake}</span>
                  <button
                    type="button"
                    onClick={() => removeCommonMistake(idx)}
                    className="text-rose-400 hover:text-rose-700 p-1 transition-colors cursor-pointer"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <input
                type="text"
                value={newMistakeInput}
                onChange={(e) => setNewMistakeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCommonMistake();
                  }
                }}
                placeholder="Add common mistake..."
                className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
              <button
                type="button"
                onClick={addCommonMistake}
                className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold text-xs transition-colors cursor-pointer"
              >
                <Plus className="size-4" />
              </button>
            </div>
          </div>

          {/* Category Tags Multi-select */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900">Category Tags</h3>
            <div className="flex flex-wrap gap-1.5">
              {tagOptions.map((t) => {
                const isSelected = tagIds.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setTagIds(tagIds.filter((id) => id !== t.id));
                      } else {
                        setTagIds([...tagIds, t.id]);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                      isSelected
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    #{t.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
