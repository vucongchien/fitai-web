"use client";

export type AIAdjustmentReason = "injury_reported" | "injury_recovered" | "profile_updated";

export interface AIAdjustmentContext {
  isAdjusting: boolean;
  reason: AIAdjustmentReason;
  muscleGroup?: string;
  targetWeightKg?: number;
  startedAt: number;
  status: "in_progress" | "completed" | "timeout";
}

const STORAGE_KEY = "fitai_ai_plan_adjustment";
const EVENT_NAME = "fitai_ai_plan_adjustment_change";
const TIMEOUT_MS = 60000; // 60 seconds max lifetime
const ESTIMATED_PROCESSING_MS = 7000; // AI generation time ~7s

let completionTimer: ReturnType<typeof setTimeout> | null = null;

export function getAIAdjustmentContext(): AIAdjustmentContext | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as AIAdjustmentContext;
    if (Date.now() - data.startedAt > TIMEOUT_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function startAIAdjustment(params: {
  reason: AIAdjustmentReason;
  muscleGroup?: string;
  targetWeightKg?: number;
}): void {
  if (typeof window === "undefined") {
    return;
  }
  if (completionTimer) {
    clearTimeout(completionTimer);
    completionTimer = null;
  }

  const now = Date.now();
  const ctx: AIAdjustmentContext = {
    isAdjusting: true,
    reason: params.reason,
    muscleGroup: params.muscleGroup,
    targetWeightKg: params.targetWeightKg,
    startedAt: now,
    status: "in_progress",
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ctx));
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: ctx }));

  // Auto transition to completed after estimated backend event processing
  completionTimer = setTimeout(() => {
    completeAIAdjustment();
  }, ESTIMATED_PROCESSING_MS);
}

export function completeAIAdjustment(): void {
  if (typeof window === "undefined") {
    return;
  }
  if (completionTimer) {
    clearTimeout(completionTimer);
    completionTimer = null;
  }

  const current = getAIAdjustmentContext();
  if (current && current.status !== "completed") {
    const updated: AIAdjustmentContext = {
      ...current,
      status: "completed",
      isAdjusting: false,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: updated }));
    // Do NOT aggressively auto-delete: let the user read and click View Changes.
  }
}

export function clearAIAdjustment(): void {
  if (typeof window === "undefined") {
    return;
  }
  if (completionTimer) {
    clearTimeout(completionTimer);
    completionTimer = null;
  }
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: null }));
}

export function subscribeAIAdjustment(callback: (ctx: AIAdjustmentContext | null) => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }
  const handler = (e: Event) => {
    const custom = e as CustomEvent<AIAdjustmentContext | null>;
    callback(custom.detail ?? getAIAdjustmentContext());
  };
  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT_NAME, handler);
    window.removeEventListener("storage", handler);
  };
}
