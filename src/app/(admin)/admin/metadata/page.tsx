"use client";

import type { LucideIcon } from "lucide-react";
import { Dumbbell, FolderTree, Layers, Pencil, Plus, Tag, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

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

/** Static tab definitions — no closure over props or state, so module scope. */
const TABS: MetadataTab[] = [
  { category: "bodyPart", label: "Body Parts", icon: Layers },
  { category: "equipment", label: "Equipments", icon: Dumbbell },
  { category: "muscle", label: "Muscles", icon: FolderTree },
  { category: "tag", label: "Tags", icon: Tag },
];

export default function AdminMetadataPage() {
  const [activeTab, setActiveTab] = useState<MetadataItem["category"]>("bodyPart");
  const [items, setItems] = useState<MetadataItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MetadataItem | null>(null);

  // UseCallback keyed on activeTab, so the effect below can depend on the
  // Function itself without re-fetching on every render.
  const loadMetadata = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await fetchMetadataList(activeTab);
      setItems(list);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    void loadMetadata();
  }, [loadMetadata]);

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
      loadMetadata();
    }
  };

  const handleSave = useCallback(
    async (data: Omit<MetadataItem, "id">) => {
      if (selectedItem) {
        await updateMetadataItem(selectedItem.id, data);
      } else {
        await createMetadataItem(data);
      }
      loadMetadata();
    },
    [selectedItem, loadMetadata],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 font-display">Catalog Metadata</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage exercise classifications, equipment types, muscle groups, and tags.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer shrink-0"
        >
          <Plus className="size-4" />
          <span>Add {TABS.find((t) => t.category === activeTab)?.label.slice(0, -1)}</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.category;
          return (
            <button
              key={t.category}
              type="button"
              onClick={() => setActiveTab(t.category)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? "bg-white text-indigo-600 border border-slate-200 shadow-xs"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
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
        <div className="py-12 text-center text-xs text-slate-400 font-semibold">
          Loading catalog metadata...
        </div>
      ) : (items.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-400 font-medium bg-white border border-slate-200 rounded-2xl">
          No items found in this category. Click Add to create one.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-indigo-200 transition-all flex items-center justify-between group"
            >
              <div className="min-w-0 pr-2">
                <h4 className="font-bold text-slate-900 text-sm truncate">{item.name}</h4>
                <p className="text-[11px] text-slate-400 font-mono truncate">ID: {item.id}</p>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  title="Edit Item"
                  onClick={() => handleOpenEdit(item)}
                  className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                >
                  <Pencil className="size-3.5" />
                </button>
                <button
                  type="button"
                  title="Delete Item"
                  onClick={() => handleDelete(item)}
                  className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ))}

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
