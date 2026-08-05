"use client";

import { Check, Dumbbell, Plus } from "lucide-react";
import { useState } from "react";

export type EquipmentSelectorProps = {
  selectedEquipment: string[];
  onChangeEquipment: (equipment: string[]) => void;
  disabled?: boolean;
};

const PRESET_EQUIPMENT = [
  "Dumbbells",
  "Barbell",
  "Bench",
  "Resistance Bands",
  "Pull-up Bar",
  "Kettlebell",
  "Cable Machine",
  "Bodyweight",
] as const;

export function EquipmentSelector({
  disabled = false,
  onChangeEquipment,
  selectedEquipment,
}: EquipmentSelectorProps) {
  const [customItem, setCustomItem] = useState("");

  function toggleEquipment(item: string) {
    if (disabled) return;
    if (selectedEquipment.includes(item)) {
      onChangeEquipment(selectedEquipment.filter((e) => e !== item));
    } else {
      onChangeEquipment([...selectedEquipment, item]);
    }
  }

  function handleAddCustom(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = customItem.trim();
    if (!trimmed || selectedEquipment.includes(trimmed)) return;
    onChangeEquipment([...selectedEquipment, trimmed]);
    setCustomItem("");
  }

  return (
    <div className="equipment-selector space-y-3 p-4 rounded-[14px] bg-[var(--color-clear-white,#FFFFFF)] border border-[var(--color-mist,#ECEEF0)]">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-graphite,#50565C)] flex items-center gap-1.5">
          <Dumbbell className="w-3.5 h-3.5 text-[var(--color-relay-blue,#4B57F2)]" />
          Available Equipment ({selectedEquipment.length} selected)
        </label>
      </div>

      {/* Equipment Pills Multi-Select */}
      <div aria-label="Select available equipment" className="flex flex-wrap gap-2" role="group">
        {PRESET_EQUIPMENT.map((item) => {
          const active = selectedEquipment.includes(item);

          return (
            <button
              aria-pressed={active}
              className={`px-3 py-1.5 rounded-[999px] text-xs font-semibold flex items-center gap-1.5 transition-all border ${
                active
                  ? "bg-[var(--color-blue-tint,#EEF0FF)] text-[var(--color-relay-blue,#4B57F2)] border-[var(--color-relay-blue,#4B57F2)]"
                  : "bg-[var(--color-clear-white,#FFFFFF)] text-[var(--color-graphite,#50565C)] border-[var(--color-mist,#ECEEF0)] hover:bg-[var(--color-soft-paper,#F7F8F6)]"
              }`}
              disabled={disabled}
              key={item}
              onClick={() => toggleEquipment(item)}
              type="button"
            >
              {active && <Check className="w-3 h-3 stroke-[3]" />}
              <span>{item}</span>
            </button>
          );
        })}

        {/* Render custom items if any */}
        {selectedEquipment
          .filter((item) => !PRESET_EQUIPMENT.includes(item as (typeof PRESET_EQUIPMENT)[number]))
          .map((item) => (
            <button
              aria-pressed
              className="px-3 py-1.5 rounded-[999px] text-xs font-semibold flex items-center gap-1.5 bg-[var(--color-blue-tint,#EEF0FF)] text-[var(--color-relay-blue,#4B57F2)] border border-[var(--color-relay-blue,#4B57F2)]"
              disabled={disabled}
              key={item}
              onClick={() => toggleEquipment(item)}
              type="button"
            >
              <Check className="w-3 h-3 stroke-[3]" />
              <span>{item}</span>
            </button>
          ))}
      </div>

      {/* Custom equipment input */}
      {!disabled && (
        <form className="flex items-center gap-2 pt-2" onSubmit={handleAddCustom}>
          <input
            className="flex-1 px-3 py-1.5 rounded-[10px] text-xs border border-[var(--color-mist,#ECEEF0)] bg-[var(--color-clear-white,#FFFFFF)] text-[var(--color-true-ink,#101214)] focus:outline-none focus:border-[var(--color-relay-blue,#4B57F2)]"
            onChange={(e) => setCustomItem(e.target.value)}
            placeholder="Add custom equipment (e.g. Foam Roller)..."
            type="text"
            value={customItem}
          />
          <button
            className="px-3 py-1.5 rounded-[10px] text-xs font-semibold bg-[var(--color-soft-paper,#F7F8F6)] text-[var(--color-true-ink,#101214)] border border-[var(--color-steel,#C9CDD1)] hover:bg-[var(--color-mist,#ECEEF0)] flex items-center gap-1"
            type="submit"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </form>
      )}
    </div>
  );
}
