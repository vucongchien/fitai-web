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
