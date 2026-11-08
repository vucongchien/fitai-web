export function isReducedMotionPreferred(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function triggerSoloHaptic(pattern: number | number[]): void {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") {
    return;
  }
  if (isReducedMotionPreferred()) {
    return;
  }
  try {
    navigator.vibrate(pattern);
  } catch {
    // Ignore on browsers that block vibration without recent gesture
  }
}

let lastSpokenText = "";
let lastSpokenTimeMs = 0;
const SPEECH_COOLDOWN_MS = 3500;

export function speakSoloAudioCue(cue: string, muted = false): void {
  if (muted || !cue || typeof window === "undefined" || !("speechSynthesis" in window)) {
    return;
  }
  const trimmed = cue.trim();
  if (!trimmed) {
    return;
  }
  const now = Date.now();
  if (trimmed === lastSpokenText && now - lastSpokenTimeMs < SPEECH_COOLDOWN_MS * 2) {
    return;
  }
  if (now - lastSpokenTimeMs < SPEECH_COOLDOWN_MS) {
    return;
  }

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(trimmed);
    utterance.lang = "en-US";
    utterance.rate = 1.05;
    window.speechSynthesis.speak(utterance);
    lastSpokenText = trimmed;
    lastSpokenTimeMs = now;
  } catch {
    // Ignore speech synthesis errors on unsupported environments
  }
}
