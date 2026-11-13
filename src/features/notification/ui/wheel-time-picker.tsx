"use client";

import { ChevronDown } from "lucide-react";
import { useCallback, useRef, useState } from "react";

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));
const WHEEL_ITEM_HEIGHT = 36;

interface WheelColumnProps {
  items: string[];
  selectedValue: string;
  ariaLabel: string;
  onSelect: (value: string) => void;
}

function WheelColumn({ items, selectedValue, ariaLabel, onSelect }: WheelColumnProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressScrollRef = useRef(false);
  const selectedIndex = Math.max(0, items.indexOf(selectedValue));
  const initialIndexRef = useRef(selectedIndex);
  initialIndexRef.current = selectedIndex;

  const attachWheelRef = useCallback((el: HTMLDivElement | null) => {
    scrollRef.current = el;
    if (!el) {
      return;
    }
    suppressScrollRef.current = true;
    el.scrollTop = initialIndexRef.current * WHEEL_ITEM_HEIGHT;
    const rafId = requestAnimationFrame(() => {
      suppressScrollRef.current = false;
    });
    return () => {
      cancelAnimationFrame(rafId);
      if (settleTimerRef.current) {
        clearTimeout(settleTimerRef.current);
      }
    };
  }, []);

  const handleScroll = () => {
    if (suppressScrollRef.current) {
      return;
    }
    if (settleTimerRef.current) {
      clearTimeout(settleTimerRef.current);
    }
    settleTimerRef.current = setTimeout(() => {
      const el = scrollRef.current;
      if (!el) {
        return;
      }
      const index = Math.min(
        items.length - 1,
        Math.max(0, Math.round(el.scrollTop / WHEEL_ITEM_HEIGHT)),
      );
      const next = items[index];
      if (next && next !== selectedValue) {
        onSelect(next);
      }
    }, 80);
  };

  const handleItemClick = (index: number, item: string) => {
    const el = scrollRef.current;
    if (el) {
      suppressScrollRef.current = true;
      el.scrollTo({ top: index * WHEEL_ITEM_HEIGHT, behavior: "smooth" });
      setTimeout(() => {
        suppressScrollRef.current = false;
      }, 220);
    }
    onSelect(item);
  };

  return (
    <div
      ref={attachWheelRef}
      role="listbox"
      aria-label={ariaLabel}
      onScroll={handleScroll}
      className="relative z-10 h-[180px] overflow-y-auto no-scrollbar snap-y snap-mandatory py-[72px]"
    >
      {items.map((item, index) => {
        const active = item === selectedValue;
        return (
          <button
            key={item}
            type="button"
            role="option"
            aria-selected={active}
            onClick={() => handleItemClick(index, item)}
            className={`flex h-9 w-full snap-center items-center justify-center text-[17px] tabular-nums transition-colors cursor-pointer ${
              active ? "font-bold text-neutral-900" : "font-medium text-neutral-400"
            }`}
          >
            {item}
          </button>
        );
      })}
    </div>
  );
}

export interface TimeSelectPillProps {
  label: string;
  value: string;
  defaultHour?: string;
  align?: "left" | "right";
  disabled: boolean;
  onChange: (nextValue: string) => void;
}

export function TimeSelectPill({
  label,
  value,
  defaultHour = "22",
  align = "left",
  disabled,
  onChange,
}: TimeSelectPillProps) {
  const [open, setOpen] = useState(false);

  const [parsedHour, parsedMinute] = value ? value.split(":") : ["", ""];
  const displayHour = parsedHour || defaultHour;
  const displayMinute = parsedMinute || "00";

  const minuteOptions =
    parsedMinute && !MINUTES.includes(parsedMinute)
      ? [...MINUTES, parsedMinute].toSorted()
      : MINUTES;

  return (
    <div
      className="relative"
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          setOpen(false);
        }
      }}
    >
      <button
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex h-10 w-full items-center justify-between gap-2 rounded-xl !border !border-solid px-3 transition-colors cursor-pointer disabled:opacity-50 ${
          open
            ? "!border-sky-500 bg-white"
            : "!border-neutral-200 bg-neutral-50/70 hover:bg-neutral-100/70"
        }`}
      >
        <span className="text-[12px] font-semibold text-neutral-400 shrink-0">{label}</span>
        <span className="flex items-center gap-1.5">
          <span
            className={`text-[14px] font-bold tabular-nums ${
              value ? "text-neutral-800" : "text-neutral-400"
            }`}
          >
            {value || "--:--"}
          </span>
          <ChevronDown
            aria-hidden="true"
            className={`h-3.5 w-3.5 text-neutral-400 transition-transform duration-150 ${
              open ? "rotate-180 text-sky-500" : ""
            }`}
          />
        </span>
      </button>

      {open && (
        <>
          <div
            aria-hidden="true"
            className="fixed inset-0 z-20"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-label={`${label} time picker`}
            className={`absolute z-30 mt-1.5 w-44 rounded-2xl border border-neutral-200/90 bg-white p-2.5 shadow-xl ${
              align === "right" ? "right-0" : "left-0"
            }`}
          >
            <div className="relative">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 h-9 rounded-xl bg-neutral-100"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 text-[16px] font-bold text-neutral-400"
              >
                :
              </span>

              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 z-20 h-12 bg-gradient-to-b from-white via-white/80 to-transparent"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-12 bg-gradient-to-t from-white via-white/80 to-transparent"
              />

              <div className="grid grid-cols-2">
                <WheelColumn
                  items={HOURS}
                  selectedValue={displayHour}
                  ariaLabel={`${label} hour`}
                  onSelect={(hour) => onChange(`${hour}:${displayMinute}`)}
                />
                <WheelColumn
                  items={minuteOptions}
                  selectedValue={displayMinute}
                  ariaLabel={`${label} minute`}
                  onSelect={(minute) => onChange(`${displayHour}:${minute}`)}
                />
              </div>
            </div>

            <div className="mt-2 flex items-center justify-between border-t border-neutral-100 pt-2">
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className="px-2 py-1 text-[12px] font-semibold text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!value) {
                    onChange(`${displayHour}:${displayMinute}`);
                  }
                  setOpen(false);
                }}
                className="rounded-lg bg-sky-500 px-3 py-1 text-[12px] font-bold text-white hover:bg-sky-600 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
