"use client";

import { Camera, ImageOff, MoveHorizontal, Plus } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import type { BodyMetricEntry } from "../model/types";

interface PhotoComparisonSliderProps {
  photos: readonly BodyMetricEntry[];
  onOpenLogModal: () => void;
}

export function PhotoComparisonSlider({ photos, onOpenLogModal }: PhotoComparisonSliderProps) {
  const [sliderPercent, setSliderPercent] = useState(50);
  const [beforeIndex, setBeforeIndex] = useState(0);
  const [afterIndex, setAfterIndex] = useState(() => Math.max(0, photos.length - 1));
  const [selectingSlot, setSelectingSlot] = useState<"before" | "after">("after");
  const [failedUrls, setFailedUrls] = useState<Record<string, boolean>>({});
  const [prevCount, setPrevCount] = useState(photos.length);

  if (photos.length !== prevCount) {
    setPrevCount(photos.length);
    if (photos.length > prevCount) {
      setAfterIndex(Math.max(0, photos.length - 1));
    }
  }

  const markFailed = (url: string) => {
    setFailedUrls((prev) => (prev[url] ? prev : { ...prev, [url]: true }));
  };

  const safeBeforeIndex = Math.min(beforeIndex, Math.max(0, photos.length - 1));
  const safeAfterIndex = Math.min(afterIndex, Math.max(0, photos.length - 1));

  const beforePhoto = photos[safeBeforeIndex];
  const afterPhoto = photos[safeAfterIndex];

  const handleSelectThumbnail = (index: number) => {
    if (selectingSlot === "before") {
      setBeforeIndex(index);
    } else {
      setAfterIndex(index);
    }
  };

  return (
    <section
      aria-label="Progress photo comparison"
      className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5 space-y-4"
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-base sm:text-lg font-bold text-[var(--color-text)]">
            Transformation Gallery
          </h2>
          <p className="text-xs text-neutral-500">
            {photos.length >= 2
              ? "Drag the slider to compare your Before & After check-ins"
              : "Visual check-ins help you spot changes the scale misses"}
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenLogModal}
          className="inline-flex items-center gap-1 rounded-xl border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-[var(--color-text)] hover:bg-neutral-50 cursor-pointer"
        >
          <Plus size={14} />
          Add Photo
        </button>
      </div>

      {photos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 p-6 text-center space-y-2.5">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-action-soft)] text-[var(--color-action)]">
            <Camera size={20} />
          </div>
          <p className="text-sm font-semibold text-[var(--color-text)]">No progress photos yet</p>
          <p className="text-xs text-neutral-500 max-w-xs mx-auto">
            Attach a photo URL when logging a check-in to unlock the interactive Before &amp; After
            comparison slider.
          </p>
          <button
            type="button"
            onClick={onOpenLogModal}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--color-action)] px-4 py-2 text-xs font-bold text-white hover:bg-[var(--color-action-hover)] cursor-pointer"
          >
            <Camera size={14} />
            Add First Progress Photo
          </button>
        </div>
      ) : photos.length === 1 ? (
        <div className="space-y-3">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-neutral-100 border border-neutral-200">
            {failedUrls[photos[0].progressPhotoUrl] ? (
              <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-neutral-400">
                <ImageOff size={24} />
                <span className="text-xs font-medium">Photo unavailable</span>
              </div>
            ) : (
              <Image
                src={photos[0].progressPhotoUrl}
                alt={`Progress photo from ${photos[0].dateLabel}`}
                fill
                unoptimized
                sizes="(max-width: 640px) 100vw, 600px"
                className="object-cover"
                onError={() => markFailed(photos[0].progressPhotoUrl)}
              />
            )}
            <div className="absolute bottom-3 left-3 rounded-lg bg-neutral-900/75 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-xs">
              {photos[0].dateLabel} ·{" "}
              {photos[0].weightKg > 0 ? `${photos[0].weightKg} kg` : "Check-in"}
            </div>
          </div>
          <p className="text-xs text-neutral-500 text-center">
            Add one more check-in photo to unlock the interactive Before &amp; After slider.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Interactive Before / After Slider */}
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-neutral-900 border border-neutral-200 select-none">
            {/* After Image (Full background) */}
            {failedUrls[afterPhoto.progressPhotoUrl] ? (
              <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-neutral-800 text-neutral-400">
                <ImageOff size={24} />
                <span className="text-xs font-medium">After photo unavailable</span>
              </div>
            ) : (
              <Image
                src={afterPhoto.progressPhotoUrl}
                alt={`After photo from ${afterPhoto.dateLabel}`}
                fill
                unoptimized
                sizes="(max-width: 640px) 100vw, 600px"
                className="object-cover"
                onError={() => markFailed(afterPhoto.progressPhotoUrl)}
              />
            )}

            {/* Before Image (Clipped to sliderPercent) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ clipPath: `inset(0 ${100 - sliderPercent}% 0 0)` }}
            >
              {failedUrls[beforePhoto.progressPhotoUrl] ? (
                <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-neutral-800 text-neutral-400">
                  <ImageOff size={24} />
                  <span className="text-xs font-medium">Before photo unavailable</span>
                </div>
              ) : (
                <Image
                  src={beforePhoto.progressPhotoUrl}
                  alt={`Before photo from ${beforePhoto.dateLabel}`}
                  fill
                  unoptimized
                  sizes="(max-width: 640px) 100vw, 600px"
                  className="object-cover"
                  onError={() => markFailed(beforePhoto.progressPhotoUrl)}
                />
              )}
            </div>

            {/* Vertical Divider & Handle */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-0 bottom-0 w-0.5 bg-white shadow-md"
              style={{ left: `${sliderPercent}%` }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white text-neutral-900 shadow-lg ring-2 ring-neutral-900/10">
                <MoveHorizontal size={16} />
              </div>
            </div>

            {/* Accessible Range Input Overlay */}
            <input
              type="range"
              min={0}
              max={100}
              value={sliderPercent}
              onChange={(e) => setSliderPercent(Number(e.target.value))}
              aria-label="Before and after comparison slider"
              className="absolute inset-0 z-10 h-full w-full cursor-ew-resize opacity-0"
            />

            {/* Before / After Badges */}
            <div className="pointer-events-none absolute top-3 left-3 rounded-lg bg-neutral-900/75 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-xs">
              Before · {beforePhoto.dateLabel}
              {beforePhoto.weightKg > 0 ? ` (${beforePhoto.weightKg} kg)` : ""}
            </div>
            <div className="pointer-events-none absolute top-3 right-3 rounded-lg bg-[var(--color-action)]/90 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-xs">
              After · {afterPhoto.dateLabel}
              {afterPhoto.weightKg > 0 ? ` (${afterPhoto.weightKg} kg)` : ""}
            </div>
          </div>

          {/* Slot Picker & Thumbnail Strip */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-neutral-500">Assign thumbnail to:</span>
              <button
                type="button"
                onClick={() => setSelectingSlot("before")}
                className={`rounded-lg px-2.5 py-1 font-semibold cursor-pointer ${
                  selectingSlot === "before"
                    ? "bg-neutral-900 text-white"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                Before
              </button>
              <button
                type="button"
                onClick={() => setSelectingSlot("after")}
                className={`rounded-lg px-2.5 py-1 font-semibold cursor-pointer ${
                  selectingSlot === "after"
                    ? "bg-[var(--color-action)] text-white"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                After
              </button>
            </div>
            <span className="text-[11px] text-neutral-400">{photos.length} photos</span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {photos.map((photo, idx) => {
              const isBefore = idx === safeBeforeIndex;
              const isAfter = idx === safeAfterIndex;
              return (
                <button
                  key={photo.id || photo.loggedAt}
                  type="button"
                  onClick={() => handleSelectThumbnail(idx)}
                  aria-label={`Select photo from ${photo.dateLabel}`}
                  className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all cursor-pointer ${
                    isAfter
                      ? "border-[var(--color-action)]"
                      : isBefore
                        ? "border-neutral-900"
                        : "border-transparent opacity-75 hover:opacity-100"
                  }`}
                >
                  {failedUrls[photo.progressPhotoUrl] ? (
                    <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-neutral-400">
                      <ImageOff size={16} />
                    </div>
                  ) : (
                    <Image
                      src={photo.progressPhotoUrl}
                      alt={photo.dateLabel}
                      fill
                      unoptimized
                      sizes="64px"
                      className="object-cover"
                      onError={() => markFailed(photo.progressPhotoUrl)}
                    />
                  )}
                  <span className="absolute inset-x-0 bottom-0 bg-black/65 py-0.5 text-[9px] font-semibold text-white text-center">
                    {isBefore && isAfter
                      ? "Before / After"
                      : isBefore
                        ? "Before"
                        : isAfter
                          ? "After"
                          : photo.dateLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
