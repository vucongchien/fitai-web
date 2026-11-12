"use client";

import { Check, FolderTree, X } from "lucide-react";
import { useId, useState } from "react";

import type { MetadataItem } from "@/features/admin/domain/admin-types";
import { useScrollLock } from "@/shared/lib/use-scroll-lock";
import { toast } from "@/shared/ui/toast";

export interface MetadataDialogProps {
  isOpen: boolean;
  category: MetadataItem["category"];
  item?: MetadataItem | null;
  bodyParts?: { id: string; name: string }[];
  onClose: () => void;
  onSave: (data: Omit<MetadataItem, "id">) => Promise<void>;
}

export function MetadataDialog({
  isOpen,
  category,
  item,
  bodyParts = [],
  onClose,
  onSave,
}: MetadataDialogProps) {
  useScrollLock(isOpen);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--color-scrim)] backdrop-blur-xs animate-in fade-in duration-150">
      <MetadataDialogForm
        key={item?.id ?? "new"}
        category={category}
        item={item}
        bodyParts={bodyParts}
        onClose={onClose}
        onSave={onSave}
      />
    </div>
  );
}

function MetadataDialogForm({
  category,
  item,
  bodyParts = [],
  onClose,
  onSave,
}: {
  category: MetadataItem["category"];
  item?: MetadataItem | null;
  bodyParts?: { id: string; name: string }[];
  onClose: () => void;
  onSave: (data: Omit<MetadataItem, "id">) => Promise<void>;
}) {
  const fieldIdBase = useId();
  const [name, setName] = useState(item?.name || "");
  const [bodyPartId, setBodyPartId] = useState(item?.bodyPartId || (bodyParts[0]?.id ?? ""));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a category name");
      return;
    }

    if (category === "muscle" && !bodyPartId.trim()) {
      toast.error("Please select a parent body part for this muscle");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        name: name.trim(),
        category,
        bodyPartId: category === "muscle" ? bodyPartId.trim() : undefined,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoryLabel = {
    bodyPart: "Body Part",
    equipment: "Equipment",
    muscle: "Muscle Group",
    tag: "Category Tag",
  }[category];

  return (
    <div className="w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-card)] shadow-xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface-subtle)]">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-[var(--radius-input)] bg-[var(--color-action-soft)] border border-[var(--color-action)]/20 text-[var(--color-action)] flex items-center justify-center">
            <FolderTree className="size-4.5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[var(--color-text)]">
              {item ? `Edit ${categoryLabel}` : `Add New ${categoryLabel}`}
            </h2>
            <p className="text-[11px] text-[var(--color-text-muted)]">Catalog Metadata Item</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="size-7 rounded-full hover:bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Body Form */}
      <form id="metadata-form" noValidate onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="space-y-1.5">
          <label
            className="text-xs font-bold text-[var(--color-text)]"
            htmlFor={`${fieldIdBase}-1`}
          >
            Name *
          </label>
          <input
            id={`${fieldIdBase}-1`}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Pectoralis Major, Kettlebell..."
            className="w-full px-3.5 py-2 text-xs bg-[var(--color-surface-subtle)] border border-[var(--color-border)] focus:border-[var(--color-action)] focus:bg-[var(--color-surface)] rounded-[var(--radius-input)] text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:outline-none focus:ring-2 focus:ring-[var(--color-action-soft)] transition-all"
          />
        </div>

        {category === "muscle" ? (
          <div className="space-y-1.5">
            <label
              className="text-xs font-bold text-[var(--color-text)]"
              htmlFor={`${fieldIdBase}-bodypart`}
            >
              Parent Body Part *
            </label>
            <select
              id={`${fieldIdBase}-bodypart`}
              value={bodyPartId}
              onChange={(e) => setBodyPartId(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-[var(--color-surface-subtle)] border border-[var(--color-border)] focus:border-[var(--color-action)] focus:bg-[var(--color-surface)] rounded-[var(--radius-input)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-action-soft)] transition-all cursor-pointer"
            >
              <option value="">Select a body part</option>
              {bodyParts.map((bp) => (
                <option key={bp.id} value={bp.id}>
                  {bp.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </form>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2.5 px-6 py-3.5 border-t border-[var(--color-border)] bg-[var(--color-surface-subtle)]">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-[var(--radius-input)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-subtle)] text-[var(--color-text)] text-xs font-semibold border border-[var(--color-border)] transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          form="metadata-form"
          disabled={isSubmitting}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius-input)] bg-[var(--color-action)] hover:opacity-90 text-[var(--color-action-contrast)] text-xs font-bold shadow-md shadow-[var(--color-action)]/20 transition-all cursor-pointer disabled:opacity-50"
        >
          <Check className="size-3.5" />
          <span>{isSubmitting ? "Saving..." : "Save Item"}</span>
        </button>
      </div>
    </div>
  );
}
