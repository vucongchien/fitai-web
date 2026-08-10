/**
 * Web Audio API Tone Synthesizer fallback khi file audio MP3 chưa có sẵn.
 * Phát âm thanh chime/beep chất lượng cao, không phụ thuộc vào network.
 */

let globalAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") {
    return null;
  }
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) {
    return null;
  }
  if (!globalAudioCtx) {
    globalAudioCtx = new AudioCtx();
  }
  if (globalAudioCtx.state === "suspended") {
    void globalAudioCtx.resume().catch(() => {});
  }
  return globalAudioCtx;
}

export type CueToneType = "start" | "end" | "good" | "warning" | "error";

/**
 * Phát âm thanh tổng hợp trực tiếp bằng Web Audio API
 */
export function playSyntheticCueTone(type: CueToneType = "good"): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) {
      return;
    }

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "start") {
      // 2-tone chime đi lên (440Hz -> 880Hz)
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === "good") {
      // Âm thanh hoàn thành tốt (587Hz -> 880Hz)
      osc.type = "triangle";
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === "warning" || type === "error") {
      // Âm thanh cảnh báo tư thế (330Hz)
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(330, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else {
      // End of set (880Hz -> 440Hz)
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.2);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  } catch (error) {
    console.debug("[playSyntheticCueTone] Web Audio not allowed yet:", error);
  }
}

export function formatVietnameseSecond(count: number): string {
  const words: Record<number, string> = {
    1: "Một",
    2: "Hai",
    3: "Ba",
    4: "Bốn",
    5: "Năm",
    6: "Sáu",
    7: "Bảy",
    8: "Tám",
    9: "Chín",
    10: "Mười",
    11: "Mười một",
    12: "Mười hai",
    13: "Mười ba",
    14: "Mười bốn",
    15: "Mười lăm",
    16: "Mười sáu",
    17: "Mười bảy",
    18: "Mười tám",
    19: "Mười chín",
    20: "Hai mươi",
    21: "Hai mươi mốt",
    22: "Hai mươi hai",
    23: "Hai mươi ba",
    24: "Hai mươi bốn",
    25: "Hai mươi lăm",
    26: "Hai mươi sáu",
    27: "Hai mươi bảy",
    28: "Hai mươi tám",
    29: "Hai mươi chín",
    30: "Ba mươi",
    40: "Bốn mươi",
    45: "Bốn mươi lăm",
    50: "Năm mươi",
    60: "Sáu mươi",
  };
  return words[count] ?? `${count} giây`;
}

let lastSpokenText = "";
let lastSpokenTime = 0;
let lastErrorFinishedTime = 0;
let cachedViVoice: SpeechSynthesisVoice | null = null;

function getViVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return null;
  }
  if (cachedViVoice) {
    return cachedViVoice;
  }
  const voices = window.speechSynthesis.getVoices();
  const found = voices.find(
    (v) =>
      v.lang.toLowerCase().includes("vi") ||
      v.name.toLowerCase().includes("vietnamese") ||
      v.name.toLowerCase().includes("tiếng việt"),
  );
  if (found) {
    cachedViVoice = found;
  }
  return cachedViVoice;
}

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    cachedViVoice = null;
    getViVoice();
  };
}

/**
 * Đọc lời thoại trực tiếp sử dụng Web Speech API (Text-To-Speech / TTS)
 */
export function speakText(
  text: string,
  lang = "vi-VN",
  options: {
    pitch?: number;
    rate?: number;
    priority?: "error" | "normal";
    cooldownGapSec?: number;
    onEnd?: () => void;
  } = {},
): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window) || !text) {
    return false;
  }
  try {
    const now = Date.now();
    const isErrorPriority = options.priority === "error";

    // Suppress non-error/second counting speech while speech synthesis is actively speaking
    if (!isErrorPriority) {
      if (window.speechSynthesis.speaking) {
        return false;
      }
      if (text === lastSpokenText && now - lastSpokenTime < 2500) {
        return false;
      }
    }

    if (isErrorPriority) {
      // If currently speaking an error cue, ignore new error cue
      if (window.speechSynthesis.speaking) {
        return false;
      }
      // Check required silence gap AFTER previous error cue finished speaking (1.5s Danger / 3.0s Warning)
      const gapMs = (options.cooldownGapSec ?? 1.5) * 1000;
      if (now - lastErrorFinishedTime < gapMs) {
        return false; // Silence gap still active — skip/ignore incoming error cue
      }
      window.speechSynthesis.cancel();
    } else if (window.speechSynthesis.speaking) {
      if (now - lastSpokenTime < 1500) {
        return false;
      }
      window.speechSynthesis.cancel();
    }

    lastSpokenText = text;
    lastSpokenTime = now;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = options.rate ?? 1.0;
    utterance.pitch = options.pitch ?? 1.0;
    utterance.volume = 1.0;

    const voice = getViVoice();
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onend = () => {
      if (isErrorPriority) {
        lastErrorFinishedTime = Date.now();
      }
      options.onEnd?.();
    };

    utterance.onerror = () => {
      if (isErrorPriority) {
        lastErrorFinishedTime = Date.now();
      }
    };

    window.speechSynthesis.speak(utterance);
    return true;
  } catch (error) {
    console.debug("[speakText] SpeechSynthesis error:", error);
    return false;
  }
}

export function cancelAllSpeech(): void {
  lastSpokenText = "";
  lastSpokenTime = 0;
  lastErrorFinishedTime = 0;
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore
    }
  }
}


