"use client";

import { Camera, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { type FormEvent, useCallback, useState } from "react";

import { logBodyMetricsServerAction } from "@/features/profile/server/profile-actions";
import { useToast } from "@/shared/ui/toast/toast-context";

import { isSafePhotoUrl } from "../model/progress-aggregator";

interface LogMetricsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultWeightKg: number;
  defaultBodyFatPercent: number;
  defaultHeightCm: number;
}

export function LogMetricsModal(props: LogMetricsModalProps) {
  if (!props.isOpen) {
    return null;
  }

  const resetKey = `${props.defaultWeightKg}-${props.defaultBodyFatPercent}-${props.defaultHeightCm}`;
  return <LogMetricsModalContent key={resetKey} {...props} />;
}

function LogMetricsModalContent({
  onClose,
  defaultWeightKg,
  defaultBodyFatPercent,
  defaultHeightCm,
}: LogMetricsModalProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [weightInput, setWeightInput] = useState(
    defaultWeightKg >= 20 ? String(defaultWeightKg) : "",
  );
  const [bodyFatInput, setBodyFatInput] = useState(
    defaultBodyFatPercent >= 3 ? String(defaultBodyFatPercent) : "",
  );
  const [heightInput, setHeightInput] = useState(
    defaultHeightCm >= 100 ? String(defaultHeightCm) : "",
  );
  const [photoUrlInput, setPhotoUrlInput] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const escapeListenerRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) {
        return;
      }
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape" && !isSubmitting) {
          onClose();
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    },
    [isSubmitting, onClose],
  );

  const trimmedPhoto = photoUrlInput.trim();
  const hasValidPhotoPreview = trimmedPhoto.length > 0 && isSafePhotoUrl(trimmedPhoto);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const weightKg = Number(weightInput);
    if (!Number.isFinite(weightKg) || weightKg < 20 || weightKg > 350) {
      setErrorMsg("Please enter a valid weight between 20 and 350 kg.");
      return;
    }

    const bodyFatPercent = bodyFatInput.trim() === "" ? 0 : Number(bodyFatInput);
    if (
      bodyFatInput.trim() !== "" &&
      (!Number.isFinite(bodyFatPercent) || bodyFatPercent < 3 || bodyFatPercent > 65)
    ) {
      setErrorMsg("Body fat % should be between 3% and 65% (or leave blank).");
      return;
    }

    const heightCm = heightInput.trim() === "" ? 0 : Number(heightInput);
    if (
      heightInput.trim() !== "" &&
      (!Number.isFinite(heightCm) || heightCm < 100 || heightCm > 250)
    ) {
      setErrorMsg("Height should be between 100 and 250 cm.");
      return;
    }

    if (trimmedPhoto && !isSafePhotoUrl(trimmedPhoto)) {
      setErrorMsg("Photo URL must start with https:// or http://.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await logBodyMetricsServerAction({
        weightKg,
        bodyFatPercent,
        heightCm: heightCm > 0 ? heightCm : undefined,
        progressPhotoUrl: trimmedPhoto || undefined,
      });

      if (!res.success) {
        setErrorMsg(res.message || "Could not save check-in. Please try again.");
        showToast({ message: res.message || "Failed to save check-in", type: "error" });
        return;
      }

      showToast({ message: "Body check-in logged!", type: "success" });
      setPhotoUrlInput("");
      onClose();
      router.refresh();
    } catch {
      setErrorMsg("Unexpected error while saving check-in.");
      showToast({ message: "Unexpected error while saving check-in.", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      ref={escapeListenerRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-neutral-900/40 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="log-metrics-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-2xl bg-white border border-neutral-200 shadow-2xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 id="log-metrics-title" className="font-display text-lg font-bold text-neutral-900">
              Log Body Check-in
            </h2>
            <p className="text-xs text-neutral-500">
              Record today&apos;s weight, body fat, or progress photo
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-semibold text-neutral-700">Weight (kg) *</span>
              <input
                type="number"
                step="0.1"
                min="20"
                max="350"
                required
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                placeholder="e.g. 72.5"
                className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-[var(--color-action)] focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-neutral-700">
                Body Fat (%) <span className="font-normal text-neutral-400">(optional)</span>
              </span>
              <input
                type="number"
                step="0.1"
                min="3"
                max="65"
                value={bodyFatInput}
                onChange={(e) => setBodyFatInput(e.target.value)}
                placeholder="Skip if unknown"
                className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-[var(--color-action)] focus:outline-none"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-xs font-semibold text-neutral-700">Height (cm)</span>
            <input
              type="number"
              step="0.5"
              min="100"
              max="250"
              value={heightInput}
              onChange={(e) => setHeightInput(e.target.value)}
              placeholder="e.g. 175"
              className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-[var(--color-action)] focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-neutral-700 flex items-center gap-1">
              <Camera size={13} />
              Progress Photo URL (optional)
            </span>
            <input
              type="url"
              value={photoUrlInput}
              onChange={(e) => setPhotoUrlInput(e.target.value)}
              placeholder="https://..."
              className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-[var(--color-action)] focus:outline-none"
            />
          </label>

          {hasValidPhotoPreview && (
            <div className="relative h-28 w-full overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50">
              <Image
                src={trimmedPhoto}
                alt="Check-in preview"
                fill
                unoptimized
                sizes="400px"
                className="object-cover"
              />
            </div>
          )}

          {errorMsg && (
            <p
              role="alert"
              className="rounded-xl bg-[var(--color-danger-soft)] px-3 py-2 text-xs font-medium text-[var(--color-danger)]"
            >
              {errorMsg}
            </p>
          )}

          <div className="flex items-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-neutral-300 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-xl bg-[var(--color-action)] py-2.5 text-sm font-bold text-white hover:bg-[var(--color-action-hover)] disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? "Saving..." : "Save Check-in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
