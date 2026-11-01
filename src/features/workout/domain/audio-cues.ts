// Web Audio API tone synthesizer fallback and audio cues

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

// Synthesize audio tone directly via Web Audio API
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

export function formatVietnameseRepCount(count: number): string {
  return formatVietnameseSecond(count);
}

export type SupportedLanguage = "vi-VN" | "en-US";

const VIETNAMESE_DIACRITICS_REGEX =
  /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

const VIETNAMESE_UNACCENTED_TOKENS = new Set([
  "khong", "xuong", "len", "mong", "lung", "bung", "dau", "goi", "tay", "chan",
  "gong", "siet", "tho", "hit", "thang", "ngay", "nhung", "chut", "ban", "nhe",
  "bat", "dau", "hiep", "hoan", "thanh", "nghi", "ngoi", "lan", "dung", "nang",
]);

// Detects whether the text is Vietnamese ("vi-VN") or English ("en-US")
export function detectLanguage(text: string): SupportedLanguage {
  if (!text || typeof text !== "string") {
    return "en-US";
  }

  if (VIETNAMESE_DIACRITICS_REGEX.test(text)) {
    return "vi-VN";
  }

  const words = text.toLowerCase().match(/[\p{L}0-9]+/gu) || [];
  if (words.length > 0) {
    let viCount = 0;
    for (const w of words) {
      if (VIETNAMESE_UNACCENTED_TOKENS.has(w)) {
        viCount += 1;
      }
    }
    if (viCount / words.length >= 0.4) {
      return "vi-VN";
    }
  }

  return "en-US";
}

const TECHNICAL_CUE_MAP: Record<string, string> = {
  signed_hip_y_diff: "Võng lưng hoặc chổng mông quá cao, hãy siết chặt cơ bụng",
  knee_angle: "Đầu gối chưa đạt độ sâu chuẩn, hãy hạ thấp thêm một chút",
  elbow_angle: "Góc khuỷu tay chưa chuẩn, hãy điều chỉnh góc gập tay",
  hip_angle: "Góc gập hông chưa chuẩn, hãy giữ thẳng trục người",
  torso_angle: "Thân người ngả quá nhiều, hãy giữ ngực mở và lưng thẳng",
  spine_alignment: "Lưng đang bị cong, hãy giữ thẳng cột sống",
  knee_valgus: "Đầu gối đang bị sụp vào trong, hãy mở đầu gối hướng theo mũi chân",
  err_knee_valgus: "Đầu gối đang bị sụp vào trong, hãy mở đầu gối hướng theo mũi chân",
  knee_over_toe: "Đầu gối vượt quá mũi chân, hãy đẩy hông ra sau",
  err_knee_over_toe: "Đầu gối vượt quá mũi chân, hãy đẩy hông ra sau",
  incomplete_rom: "Biên độ chuyển động chưa đủ, hãy hoàn thành hết tầm động tác",
  fast_eccentric: "Xuống quá nhanh, hãy kiểm soát chuyển động chậm lại",
  asymmetry: "Chuyển động hai bên không đều, hãy giữ cân bằng hai bên",
  alignment: "Lệch trục tư thế, hãy điều chỉnh lại vị trí thân người",
  head_position: "Đầu đang cúi hoặc ngửa quá mức, hãy giữ cổ thẳng tự nhiên",
  foot_placement: "Vị trí đặt chân chưa vững, hãy điều chỉnh khoảng cách hai bàn chân",
};

const ENGLISH_PHRASE_TRANSLATIONS: Record<string, string> = {
  "keep back flat": "Giữ lưng thẳng",
  "keep your back flat": "Giữ lưng thẳng",
  "keep back straight": "Giữ lưng thẳng",
  "keep your back straight": "Giữ lưng thẳng",
  "chest up": "Ưỡn ngực lên",
  "core engaged": "Gồng chặt cơ bụng",
  "keep core engaged": "Gồng chặt cơ bụng",
  "knees out": "Mở rộng đầu gối theo hướng mũi chân",
  "knees caving in": "Đầu gối đang bị sụp vào trong, hãy mở gối ra",
  "hip too low": "Hông bị sụp quá thấp, nâng nhẹ hông lên",
  "hip too high": "Hông bị chổng quá cao, hạ nhẹ hông xuống",
  "breathe out": "Thở ra",
  "breathe in": "Hít vào",
  "rep completed": "Hoàn thành lần tập",
  "good rep": "Tốt lắm",
  "take a rest": "Hãy nghỉ ngơi",
};

// Maps or translates raw BE codes/phrases to natural spoken feedback
export function mapCueToSpokenText(
  raw: string,
  targetLang: "vi" | "en" = "vi",
): string {
  if (!raw || typeof raw !== "string") {
    return "";
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return "";
  }

  const sanitized = trimmed
    .replace(/^[0-9><=-]+\s*(cm|deg|°)?:\s*/i, "")
    .replace(/^rule[-_]/i, "")
    .trim();

  const lowerKey = sanitized.toLowerCase().replace(/\s+/g, "_");
  if (targetLang === "vi" && TECHNICAL_CUE_MAP[lowerKey]) {
    return TECHNICAL_CUE_MAP[lowerKey];
  }

  const lowerSentence = sanitized.toLowerCase().replace(/[.,!?;:]+$/, "");
  if (targetLang === "vi" && ENGLISH_PHRASE_TRANSLATIONS[lowerSentence]) {
    return ENGLISH_PHRASE_TRANSLATIONS[lowerSentence];
  }

  if (detectLanguage(sanitized) === "vi-VN" || (sanitized.includes(" ") && !sanitized.includes("_"))) {
    return sanitized;
  }

  if (sanitized.includes("_") || sanitized.includes("-")) {
    const cleanWord = sanitized.replace(/[-_]/g, " ").toLowerCase();
    return targetLang === "vi" ? `Lỗi tư thế: ${cleanWord}` : `Form issue: ${cleanWord}`;
  }

  return sanitized;
}

let lastSpokenText = "";
let lastSpokenTime = 0;
let lastErrorFinishedTime = 0;
let cachedViVoice: SpeechSynthesisVoice | null = null;
let cachedEnVoice: SpeechSynthesisVoice | null = null;
let activeUtterance: SpeechSynthesisUtterance | null = null;
let watchdogTimer: ReturnType<typeof setTimeout> | null = null;

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
      v.lang.toLowerCase().replace(/_/g, "-").startsWith("vi") ||
      v.name.toLowerCase().includes("vietnamese") ||
      v.name.toLowerCase().includes("tiếng việt"),
  );
  if (found) {
    cachedViVoice = found;
  }
  return cachedViVoice;
}

function getEnVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return null;
  }
  if (cachedEnVoice) {
    return cachedEnVoice;
  }
  const voices = window.speechSynthesis.getVoices();
  const found =
    voices.find((v) => v.lang.toLowerCase().replace(/_/g, "-") === "en-us") ||
    voices.find((v) => v.lang.toLowerCase().startsWith("en")) ||
    voices.find((v) => v.name.toLowerCase().includes("english"));
  if (found) {
    cachedEnVoice = found;
  }
  return cachedEnVoice;
}

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    cachedViVoice = null;
    cachedEnVoice = null;
    getViVoice();
    getEnVoice();
  };
}

// Speaks text directly using Web Speech API (TTS)
export function speakText(
  text: string,
  preferredLang?: string,
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
    const synth = window.speechSynthesis;
    const now = Date.now();
    const isErrorPriority = options.priority === "error";

    // Suppress exact duplicate speech within a short interval
    if (text === lastSpokenText && now - lastSpokenTime < 1200) {
      return false;
    }

    if (isErrorPriority) {
      const gapMs = (options.cooldownGapSec ?? 1.5) * 1000;
      if (now - lastErrorFinishedTime < gapMs) {
        return false;
      }
    }

    // Always clear stuck queue and cancel previous speech to prevent Chrome freeze
    if (synth.speaking || synth.pending || synth.paused) {
      synth.cancel();
    }
    if (watchdogTimer) {
      clearTimeout(watchdogTimer);
      watchdogTimer = null;
    }

    lastSpokenText = text;
    lastSpokenTime = now;

    // Detect language or auto-correct when English was passed for obvious Vietnamese text
    const detected = detectLanguage(text);
    let targetLang = preferredLang && preferredLang !== "auto" ? preferredLang : detected;
    if (targetLang.toLowerCase().startsWith("en") && detected === "vi-VN") {
      targetLang = "vi-VN";
    }

    const isVietnamese = targetLang.toLowerCase().startsWith("vi");
    const utterance = new SpeechSynthesisUtterance(text);
    activeUtterance = utterance;

    utterance.lang = isVietnamese ? "vi-VN" : "en-US";
    utterance.rate = options.rate ?? 1.0;
    utterance.pitch = options.pitch ?? 1.0;
    utterance.volume = 1.0;

    if (isVietnamese) {
      const viVoice = getViVoice();
      if (viVoice) {
        utterance.voice = viVoice;
      }
    } else {
      const enVoice = getEnVoice();
      if (enVoice) {
        utterance.voice = enVoice;
      }
    }

    const cleanup = () => {
      if (activeUtterance === utterance) {
        activeUtterance = null;
      }
      if (watchdogTimer) {
        clearTimeout(watchdogTimer);
        watchdogTimer = null;
      }
    };

    utterance.onend = () => {
      cleanup();
      if (isErrorPriority) {
        lastErrorFinishedTime = Date.now();
      }
      options.onEnd?.();
    };

    utterance.onerror = (e) => {
      cleanup();
      if (isErrorPriority) {
        lastErrorFinishedTime = Date.now();
      }
      console.debug("[speakText] Utterance error:", e.error);
    };

    // Watchdog: If browser hangs and never fires onend (Chromium bug), force cancel
    const maxDurationMs = Math.max(text.length * 150, 4000);
    watchdogTimer = setTimeout(() => {
      if (activeUtterance === utterance) {
        console.debug("[speakText] Watchdog timeout: clearing stuck speech queue");
        cleanup();
        synth.cancel();
      }
    }, maxDurationMs);

    synth.speak(utterance);
    if (synth.paused) {
      synth.resume();
    }
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
  activeUtterance = null;
  if (watchdogTimer) {
    clearTimeout(watchdogTimer);
    watchdogTimer = null;
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore
    }
  }
}
