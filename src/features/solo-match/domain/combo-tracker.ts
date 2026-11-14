export const COMBO_TIMEOUT_MS = 6000;

export const COMBO_MILESTONES = [3, 5, 10, 15, 20, 30, 50] as const;

export interface ComboState {
  lastMilestone: number | null;
  lastRepAtMs: number | null;
  milestoneLabel: string | null;
  streak: number;
}

export function createInitialComboState(): ComboState {
  return {
    lastMilestone: null,
    lastRepAtMs: null,
    milestoneLabel: null,
    streak: 0,
  };
}

export function getComboMilestoneLabel(streak: number): string | null {
  if (streak === 3) return "3x STREAK";
  if (streak === 5) return "5x ON FIRE!";
  if (streak === 10) return "10x UNSTOPPABLE!";
  if (streak === 15) return "15x DOMINATING!";
  if (streak === 20) return "20x GODLIKE!";
  if (streak >= 30 && streak % 10 === 0) return `${streak}x LEGENDARY!`;
  return null;
}

export function advanceComboState(
  prev: ComboState,
  params: {
    hasFormError: boolean;
    nowMs: number;
    repIncremented: boolean;
    timeoutMs?: number;
  },
): ComboState {
  const timeoutMs = params.timeoutMs ?? COMBO_TIMEOUT_MS;

  if (params.hasFormError) {
    return createInitialComboState();
  }

  const isExpired = prev.lastRepAtMs !== null && params.nowMs - prev.lastRepAtMs > timeoutMs;

  if (params.repIncremented) {
    const nextStreak = isExpired ? 1 : prev.streak + 1;
    const milestoneLabel = getComboMilestoneLabel(nextStreak);

    return {
      lastMilestone: milestoneLabel ? nextStreak : null,
      lastRepAtMs: params.nowMs,
      milestoneLabel,
      streak: nextStreak,
    };
  }

  if (prev.streak > 0 && isExpired) {
    return createInitialComboState();
  }

  return prev;
}
