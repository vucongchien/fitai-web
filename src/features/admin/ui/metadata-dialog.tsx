"use client";

import { Check, FolderTree, X } from "lucide-react";
import { useEffect, useId, useState } from "react";

import type { MetadataItem } from "@/features/admin/domain/admin-types";

export interface MetadataDialogProps {
  isOpen: boolean;
  category: MetadataItem["category"];
  item?: MetadataItem | null;
  onClose: () => void;
  onSave: (data: Omit<MetadataItem, "id">) => Promise<void>;
}

export function MetadataDialog({ isOpen, category, item, onClose, onSave }: MetadataDialogProps) {
  const fieldIdBase = useId();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (item) {
      setName(item.name);
      setDescription(item.description || "");
    } else {
      setName("");
      setDescription("");
    }
  }, [item, isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        name: name.trim(),
        category,
        description: description.trim(),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
              <FolderTree className="size-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {item ? `Edit ${categoryLabel}` : `Add New ${categoryLabel}`}
              </h2>
              <p className="text-[11px] text-slate-500">Catalog Metadata Item</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-7 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Body Form */}
        <form id="metadata-form" onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700" htmlFor={`${fieldIdBase}-1`}>
              Name *
            </label>
            <input
              id={`${fieldIdBase}-1`}
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Pectoralis Major, Kettlebell..."
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700" htmlFor={`${fieldIdBase}-2`}>
              Description (Optional)
            </label>
            <textarea
              id={`${fieldIdBase}-2`}
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary or anatomical note..."
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-3.5 border-t border-slate-100 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="metadata-form"
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <Check className="size-3.5" />
            <span>{isSubmitting ? "Saving..." : "Save Item"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
