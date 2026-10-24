"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import { Dumbbell, FolderTree, Layers, Pencil, Plus, Tag, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";

import {
  createMetadataItem,
  deleteMetadataItem,
  fetchMetadataList,
  updateMetadataItem,
} from "@/features/admin/api/admin-exercise-service";
import type { MetadataItem } from "@/features/admin/domain/admin-types";
import { MetadataDialog } from "@/features/admin/ui/metadata-dialog";

interface MetadataTab {
  category: MetadataItem["category"];
  label: string;
  icon: LucideIcon;
}

// Static tab definitions kept at module scope.
const TABS: MetadataTab[] = [
  { category: "bodyPart", label: "Body Parts", icon: Layers },
  { category: "equipment", label: "Equipments", icon: Dumbbell },
  { category: "muscle", label: "Muscles", icon: FolderTree },
  { category: "tag", label: "Tags", icon: Tag },
];

export default function AdminMetadataPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<MetadataItem["category"]>("bodyPart");

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["admin-metadata", activeTab],
    queryFn: () => fetchMetadataList(activeTab),
  });

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MetadataItem | null>(null);

  const handleOpenAdd = useCallback(() => {
    setSelectedItem(null);
    setIsDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => setIsDialogOpen(false), []);

  const handleOpenEdit = (item: MetadataItem) => {
    setSelectedItem(item);
    setIsDialogOpen(true);
  };

  const handleDelete = async (item: MetadataItem) => {
    if (confirm(`Delete metadata item "${item.name}"?`)) {
      await deleteMetadataItem(item.id);
      await queryClient.invalidateQueries({ queryKey: ["admin-metadata"] });
    }
  };

  const handleSave = useCallback(
    async (data: Omit<MetadataItem, "id">) => {
      if (selectedItem) {
        await updateMetadataItem(selectedItem.id, data);
      } else {
        await createMetadataItem(data);
      }
      await queryClient.invalidateQueries({ queryKey: ["admin-metadata"] });
    },
    [selectedItem, queryClient],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text)] font-display">
            Catalog Metadata
          </h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Manage exercise classifications, equipment types, muscle groups, and tags.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[var(--radius-input)] bg-[var(--color-action)] hover:opacity-90 text-[var(--color-action-contrast)] font-bold text-xs shadow-md shadow-[var(--color-action)]/20 transition-all cursor-pointer shrink-0"
        >
          <Plus className="size-4" />
          <span>Add {TABS.find((t) => t.category === activeTab)?.label.slice(0, -1)}</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--color-border)] pb-2">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.category;
          return (
            <button
              key={t.category}
              type="button"
              onClick={() => setActiveTab(t.category)}
              className={`flex items-center gap-2 px-4 py-2 rounded-[var(--radius-input)] text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? "bg-[var(--color-surface)] text-[var(--color-action)] border border-[var(--color-border)] shadow-xs"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-subtle)]"
              }`}
            >
              <Icon className="size-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Grid of Items */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-[var(--color-text-dim)] font-semibold">
          Loading catalog metadata...
        </div>
      ) : items.length === 0 ? (
        <div className="py-12 text-center text-xs text-[var(--color-text-dim)] font-medium bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-card)]">
          No items found in this category. Click Add to create one.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-[var(--radius-card)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs hover:border-[var(--color-action)]/50 transition-all flex items-center justify-between group"
            >
              <div className="min-w-0 pr-2">
                <h4 className="font-bold text-[var(--color-text)] text-sm truncate">{item.name}</h4>
                <p className="text-[11px] text-[var(--color-text-dim)] font-mono truncate">
                  ID: {item.id}
                </p>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  title="Edit Item"
                  onClick={() => handleOpenEdit(item)}
                  className="p-1.5 rounded-[var(--radius-input)] hover:bg-[var(--color-action-soft)] text-[var(--color-text-muted)] hover:text-[var(--color-action)] transition-colors cursor-pointer"
                >
                  <Pencil className="size-3.5" />
                </button>
                <button
                  type="button"
                  title="Delete Item"
                  onClick={() => handleDelete(item)}
                  className="p-1.5 rounded-[var(--radius-input)] hover:bg-[var(--color-effort-soft)] text-[var(--color-text-muted)] hover:text-[var(--color-effort)] transition-colors cursor-pointer"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Metadata Dialog */}
      <MetadataDialog
        isOpen={isDialogOpen}
        category={activeTab}
        item={selectedItem}
        onClose={handleCloseDialog}
        onSave={handleSave}
      />
    </div>
  );
}
