"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Archive,
  ArrowLeft,
  CheckCircle2,
  Dumbbell,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useId, useState } from "react";

import {
  approveExercise,
  archiveExercise,
  deleteExercise,
  fetchAdminExerciseById,
  fetchMetadataList,
  updateExercise,
} from "@/features/admin/api/admin-exercise-service";
import {
  EXERCISE_STATUS_LABEL,
  EXERCISE_STATUS_STYLE,
  type AdminExercise,
  type AdminExerciseStatus,
  type MetadataItem,
} from "@/features/admin/domain/admin-types";
import { MotionSpecDialog } from "@/features/admin/ui/motion-spec-dialog";
import type { Difficulty } from "@/features/exercise/domain/exercise";
import { toast } from "@/shared/ui/toast";

export default function AdminExerciseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-exercise", id],
    queryFn: async () => {
      const [exData, metaList] = await Promise.all([
        fetchAdminExerciseById(id),
        fetchMetadataList(),
      ]);
      return { exercise: exData, metadata: metaList };
    },
  });

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-[var(--color-text-muted)] space-y-3">
        <Dumbbell className="size-8 animate-bounce text-[var(--color-action)]" />
        <p className="text-xs font-semibold">Loading exercise details...</p>
      </div>
    );
  }

  if (!data?.exercise) {
    return (
      <div className="py-16 text-center space-y-4">
        <h2 className="text-lg font-bold text-[var(--color-text)]">Exercise Not Found</h2>
        <p className="text-xs text-[var(--color-text-muted)]">
          The requested exercise with ID `{id}` does not exist.
        </p>
        <Link
          href="/admin/exercises"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-input)] bg-[var(--color-surface-subtle)] hover:bg-[var(--color-surface)] text-[var(--color-text)] text-xs font-bold border border-[var(--color-border)] transition-colors"
        >
          <ArrowLeft className="size-4" />
          <span>Back to Catalog</span>
        </Link>
      </div>
    );
  }

  return (
    <AdminExerciseForm
      key={data.exercise.id}
      id={id}
      initialExercise={data.exercise}
      metadata={data.metadata}
    />
  );
}

function AdminExerciseForm({
  id,
  initialExercise,
  metadata,
}: {
  id: string;
  initialExercise: AdminExercise;
  metadata: MetadataItem[];
}) {
  const fieldIdBase = useId();
  const router = useRouter();

  const [exercise, setExercise] = useState<AdminExercise>(initialExercise);
  const [isSaving, setIsSaving] = useState(false);
  const [isMotionSpecDialogOpen, setIsMotionSpecDialogOpen] = useState(false);

  // Form Fields State directly initialized without useEffect
  const [name, setName] = useState(initialExercise.name);
  const [status, setStatus] = useState<AdminExerciseStatus>(initialExercise.status);
  const [bodyPartId, setBodyPartId] = useState(initialExercise.bodyPartId);
  const [equipmentId, setEquipmentId] = useState(initialExercise.equipmentId);
  const [targetMuscleId, setTargetMuscleId] = useState(initialExercise.targetMuscleId);
  const [secondaryMuscleIds, setSecondaryMuscleIds] = useState<string[]>(
    initialExercise.secondaryMuscleIds || [],
  );
  const [difficulty, setDifficulty] = useState<Difficulty>(initialExercise.difficulty);
  const [defaultRestSeconds, setDefaultRestSeconds] = useState(initialExercise.defaultRestSeconds);
  const [videoUrl, setVideoUrl] = useState(initialExercise.videoUrl || "");
  const [thumbnailUrl, setThumbnailUrl] = useState(initialExercise.thumbnailUrl || "");
  const [instructions, setInstructions] = useState(initialExercise.instructions || "");
  const [tagIds, setTagIds] = useState<string[]>(initialExercise.tagIds || []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter an exercise title");
      return;
    }
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
        videoUrl: videoUrl.trim() || undefined,
        thumbnailUrl: thumbnailUrl.trim() || undefined,
        instructions,
        tagIds,
      });
      setExercise(updated);
      toast.success("Exercise updated successfully!");
      router.push("/admin/exercises");
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

  const bodyPartOptions = metadata.filter((m) => m.category === "bodyPart");
  const equipmentOptions = metadata.filter((m) => m.category === "equipment");
  const muscleOptions = metadata.filter((m) => m.category === "muscle");
  const tagOptions = metadata.filter((m) => m.category === "tag");

  const statusStyle = EXERCISE_STATUS_STYLE[status];

  return (
    <form noValidate onSubmit={handleSave} className="space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/admin/exercises"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-action)] transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to Exercise Catalog</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-[var(--color-text)] font-display">{name}</h1>
            <span
              className={`px-3 py-0.5 rounded-full text-xs font-bold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
            >
              {EXERCISE_STATUS_LABEL[status]}
            </span>
          </div>
        </div>

        {/* Action Header Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsMotionSpecDialogOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[var(--radius-input)] bg-[var(--color-action-soft)] hover:opacity-90 text-[var(--color-action)] border border-[color-mix(in_srgb,var(--color-action)_25%,transparent)] text-xs font-bold transition-colors cursor-pointer"
          >
            <Sparkles className="size-4 text-[var(--color-action)]" />
            <span>AI Rules & Voice</span>
          </button>

          {(status === "created" || status === "submittedForApproval") && (
            <button
              type="button"
              onClick={handleApprove}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[var(--radius-input)] bg-[var(--color-recovery-soft)] hover:opacity-90 text-[var(--color-recovery-ink)] border border-[color-mix(in_srgb,var(--color-recovery)_25%,transparent)] text-xs font-bold transition-colors cursor-pointer"
            >
              <CheckCircle2 className="size-4" />
              <span>Approve Entry</span>
            </button>
          )}

          {status !== "archived" && (
            <button
              type="button"
              onClick={handleArchive}
              className="p-2 rounded-[var(--radius-input)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)] border border-[var(--color-border)] text-xs font-bold transition-colors cursor-pointer"
              title="Archive Exercise"
            >
              <Archive className="size-4" />
            </button>
          )}

          <button
            type="button"
            onClick={handleDelete}
            className="p-2 rounded-[var(--radius-input)] bg-[var(--color-surface)] hover:bg-[var(--color-danger-soft)] text-[var(--color-text-muted)] hover:text-[var(--color-danger)] border border-[var(--color-border)] text-xs font-bold transition-colors cursor-pointer"
            title="Delete Exercise"
          >
            <Trash2 className="size-4" />
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-[var(--radius-input)] bg-[var(--color-action)] hover:opacity-90 text-[var(--color-action-contrast)] font-bold text-xs shadow-md shadow-[var(--color-action-soft)] transition-all cursor-pointer disabled:opacity-50"
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
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-hero)] p-6 space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-[var(--color-text)] border-b border-[var(--color-border)] pb-3">
              General Exercise Settings
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <label
                  className="text-xs font-bold text-[var(--color-text-muted)]"
                  htmlFor={`${fieldIdBase}-1`}
                >
                  Exercise Title *
                </label>
                <input
                  id={`${fieldIdBase}-1`}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-[var(--color-surface-subtle)] border border-[var(--color-border)] focus:border-[var(--color-action)] focus:bg-[var(--color-surface)] rounded-[var(--radius-input)] text-[var(--color-text)] focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  className="text-xs font-bold text-[var(--color-text-muted)]"
                  htmlFor={`${fieldIdBase}-2`}
                >
                  Status
                </label>
                <select
                  id={`${fieldIdBase}-2`}
                  value={status}
                  onChange={(e) => setStatus(e.target.value as AdminExerciseStatus)}
                  className="w-full px-3.5 py-2 text-xs bg-[var(--color-surface-subtle)] border border-[var(--color-border)] focus:border-[var(--color-action)] focus:bg-[var(--color-surface)] rounded-[var(--radius-input)] text-[var(--color-text)] focus:outline-none transition-all cursor-pointer"
                >
                  <option value="created">Draft</option>
                  <option value="submittedForApproval">Pending Approval</option>
                  <option value="approved">Approved</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label
                  className="text-xs font-bold text-[var(--color-text-muted)]"
                  htmlFor={`${fieldIdBase}-3`}
                >
                  Difficulty Level
                </label>
                <select
                  id={`${fieldIdBase}-3`}
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                  className="w-full px-3.5 py-2 text-xs bg-[var(--color-surface-subtle)] border border-[var(--color-border)] focus:border-[var(--color-action)] focus:bg-[var(--color-surface)] rounded-[var(--radius-input)] text-[var(--color-text)] focus:outline-none transition-all cursor-pointer"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="space-y-1.5">
                <label
                  className="text-xs font-bold text-[var(--color-text-muted)]"
                  htmlFor={`${fieldIdBase}-4`}
                >
                  Primary Body Part *
                </label>
                <select
                  id={`${fieldIdBase}-4`}
                  value={bodyPartId}
                  onChange={(e) => setBodyPartId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[var(--color-surface-subtle)] border border-[var(--color-border)] focus:border-[var(--color-action)] focus:bg-[var(--color-surface)] rounded-[var(--radius-input)] text-[var(--color-text)] focus:outline-none cursor-pointer"
                >
                  {bodyPartOptions.map((bp) => (
                    <option key={bp.id} value={bp.id}>
                      {bp.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label
                  className="text-xs font-bold text-[var(--color-text-muted)]"
                  htmlFor={`${fieldIdBase}-5`}
                >
                  Equipment *
                </label>
                <select
                  id={`${fieldIdBase}-5`}
                  value={equipmentId}
                  onChange={(e) => setEquipmentId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[var(--color-surface-subtle)] border border-[var(--color-border)] focus:border-[var(--color-action)] focus:bg-[var(--color-surface)] rounded-[var(--radius-input)] text-[var(--color-text)] focus:outline-none cursor-pointer"
                >
                  {equipmentOptions.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label
                  className="text-xs font-bold text-[var(--color-text-muted)]"
                  htmlFor={`${fieldIdBase}-6`}
                >
                  Target Muscle *
                </label>
                <select
                  id={`${fieldIdBase}-6`}
                  value={targetMuscleId}
                  onChange={(e) => setTargetMuscleId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[var(--color-surface-subtle)] border border-[var(--color-border)] focus:border-[var(--color-action)] focus:bg-[var(--color-surface)] rounded-[var(--radius-input)] text-[var(--color-text)] focus:outline-none cursor-pointer"
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
              <label
                className="text-xs font-bold text-[var(--color-text-muted)]"
                htmlFor={`${fieldIdBase}-7`}
              >
                Default Rest Time (Seconds)
              </label>
              <input
                id={`${fieldIdBase}-7`}
                type="number"
                value={defaultRestSeconds}
                onChange={(e) => setDefaultRestSeconds(Number(e.target.value))}
                className="w-full max-w-xs px-3.5 py-2 text-xs bg-[var(--color-surface-subtle)] border border-[var(--color-border)] focus:border-[var(--color-action)] focus:bg-[var(--color-surface)] rounded-[var(--radius-input)] text-[var(--color-text)] focus:outline-none"
              />
            </div>
          </div>

          {/* Detailed Instructions Textarea */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-hero)] p-6 space-y-3 shadow-xs">
            <h3 className="text-sm font-bold text-[var(--color-text)]">
              Step-by-Step Instructions
            </h3>
            <textarea
              rows={5}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Provide a detailed execution guide for coaches and members..."
              className="w-full px-3.5 py-2.5 text-xs bg-[var(--color-surface-subtle)] border border-[var(--color-border)] focus:border-[var(--color-action)] focus:bg-[var(--color-surface)] rounded-[var(--radius-input)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
            />
          </div>

          {/* Media & Video Demonstration */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-hero)] p-6 space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-[var(--color-text)] border-b border-[var(--color-border)] pb-3">
              Media & Video Demonstration
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label
                  className="text-xs font-bold text-[var(--color-text-muted)]"
                  htmlFor={`${fieldIdBase}-video-url`}
                >
                  Video URL (MP4 / WebM / Stream)
                </label>
                <input
                  id={`${fieldIdBase}-video-url`}
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://.../video.mp4"
                  className="w-full px-3.5 py-2 text-xs bg-[var(--color-surface-subtle)] border border-[var(--color-border)] focus:border-[var(--color-action)] focus:bg-[var(--color-surface)] rounded-[var(--radius-input)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label
                  className="text-xs font-bold text-[var(--color-text-muted)]"
                  htmlFor={`${fieldIdBase}-thumbnail-url`}
                >
                  Thumbnail Image URL
                </label>
                <input
                  id={`${fieldIdBase}-thumbnail-url`}
                  type="url"
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  placeholder="https://.../thumb.webp"
                  className="w-full px-3.5 py-2 text-xs bg-[var(--color-surface-subtle)] border border-[var(--color-border)] focus:border-[var(--color-action)] focus:bg-[var(--color-surface)] rounded-[var(--radius-input)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Arrays (Category Tags, Secondary Muscles) */}
        <div className="space-y-6">
          {/* Category Tags Multi-select */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-hero)] p-5 space-y-3 shadow-xs">
            <h3 className="text-sm font-bold text-[var(--color-text)]">Category Tags</h3>
            <div className="flex flex-wrap gap-1.5">
              {tagOptions.map((t) => {
                const isSelected = tagIds.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setTagIds(tagIds.filter((tagId) => tagId !== t.id));
                      } else {
                        setTagIds([...tagIds, t.id]);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-[var(--radius-input)] text-xs font-semibold transition-all border cursor-pointer ${
                      isSelected
                        ? "bg-[var(--color-action)] text-[var(--color-action-contrast)] border-[var(--color-action)]"
                        : "bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:text-[var(--color-text)]"
                    }`}
                  >
                    #{t.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Secondary Muscles Multi-select */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-hero)] p-5 space-y-3 shadow-xs">
            <h3 className="text-sm font-bold text-[var(--color-text)] flex items-center justify-between">
              <span>Secondary Muscles</span>
              <span className="text-xs text-[var(--color-action)] font-mono">
                {secondaryMuscleIds.length} Selected
              </span>
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {muscleOptions
                .filter((m) => m.id !== targetMuscleId)
                .map((ms) => {
                  const isSelected = secondaryMuscleIds.includes(ms.id);
                  return (
                    <button
                      key={ms.id}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setSecondaryMuscleIds(
                            secondaryMuscleIds.filter((muscleId) => muscleId !== ms.id),
                          );
                        } else {
                          setSecondaryMuscleIds([...secondaryMuscleIds, ms.id]);
                        }
                      }}
                      className={`px-2.5 py-1 rounded-[var(--radius-input)] text-xs font-semibold transition-all border cursor-pointer ${
                        isSelected
                          ? "bg-[var(--color-action)] text-[var(--color-action-contrast)] border-[var(--color-action)]"
                          : "bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:text-[var(--color-text)]"
                      }`}
                    >
                      {ms.name}
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      </div>

      <MotionSpecDialog
        isOpen={isMotionSpecDialogOpen}
        exerciseId={id}
        exerciseName={name}
        onClose={() => setIsMotionSpecDialogOpen(false)}
      />
    </form>
  );
}
