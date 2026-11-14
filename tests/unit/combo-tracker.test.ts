import { describe, expect, it } from "vitest";

import {
  advanceComboState,
  COMBO_TIMEOUT_MS,
  createInitialComboState,
} from "@/features/solo-match/domain/combo-tracker";

describe("Solo Match Combo Tracker", () => {
  it("increments streak on clean reps and emits milestone labels at 3, 5, and 10", () => {
    let state = createInitialComboState();

    state = advanceComboState(state, { hasFormError: false, nowMs: 1000, repIncremented: true });
    expect(state.streak).toBe(1);
    expect(state.lastMilestone).toBeNull();

    state = advanceComboState(state, { hasFormError: false, nowMs: 2500, repIncremented: true });
    expect(state.streak).toBe(2);
    expect(state.lastMilestone).toBeNull();

    state = advanceComboState(state, { hasFormError: false, nowMs: 4000, repIncremented: true });
    expect(state.streak).toBe(3);
    expect(state.lastMilestone).toBe(3);
    expect(state.milestoneLabel).toBe("3x STREAK");

    state = advanceComboState(state, { hasFormError: false, nowMs: 5500, repIncremented: true });
    expect(state.streak).toBe(4);
    expect(state.lastMilestone).toBeNull();

    state = advanceComboState(state, { hasFormError: false, nowMs: 7000, repIncremented: true });
    expect(state.streak).toBe(5);
    expect(state.lastMilestone).toBe(5);
    expect(state.milestoneLabel).toBe("5x ON FIRE!");
  });

  it("resets streak immediately when a form error is detected", () => {
    let state = createInitialComboState();
    state = advanceComboState(state, { hasFormError: false, nowMs: 1000, repIncremented: true });
    state = advanceComboState(state, { hasFormError: false, nowMs: 2000, repIncremented: true });
    expect(state.streak).toBe(2);

    state = advanceComboState(state, { hasFormError: true, nowMs: 2500, repIncremented: true });
    expect(state.streak).toBe(0);
    expect(state.lastMilestone).toBeNull();
    expect(state.lastRepAtMs).toBeNull();
  });

  it("resets streak when time between reps exceeds COMBO_TIMEOUT_MS", () => {
    let state = createInitialComboState();
    state = advanceComboState(state, { hasFormError: false, nowMs: 1000, repIncremented: true });
    state = advanceComboState(state, { hasFormError: false, nowMs: 2000, repIncremented: true });
    expect(state.streak).toBe(2);

    // Idle frame before timeout keeps streak alive
    state = advanceComboState(state, {
      hasFormError: false,
      nowMs: 2000 + COMBO_TIMEOUT_MS - 500,
      repIncremented: false,
    });
    expect(state.streak).toBe(2);

    // Idle frame after timeout resets streak to 0
    state = advanceComboState(state, {
      hasFormError: false,
      nowMs: 2000 + COMBO_TIMEOUT_MS + 100,
      repIncremented: false,
    });
    expect(state.streak).toBe(0);

    // Next clean rep after timeout starts fresh at 1
    state = advanceComboState(state, {
      hasFormError: false,
      nowMs: 2000 + COMBO_TIMEOUT_MS + 500,
      repIncremented: true,
    });
    expect(state.streak).toBe(1);
  });
});
