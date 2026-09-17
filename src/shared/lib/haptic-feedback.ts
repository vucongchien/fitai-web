/**
 * Haptic Feedback Utility cho môi trường Mobile.
 * Sử dụng Web Vibration API (navigator.vibrate) để cung cấp phản hồi xúc giác trong phòng gym.
 * An toàn tuyệt đối trên các nền tảng chưa hỗ trợ (như iOS Safari) mà không gây lỗi runtime.
 */

export const HAPTIC_PATTERNS = {
  /** Rung nhẹ khi đếm thành công 1 rep (80ms) */
  repSuccess: 80,
  /** Rung nhịp đôi khi hoàn thành trọn vẹn 1 set */
  setComplete: [100, 50, 100],
  /** Rung cảnh báo khi sai tư thế (Warning - severity 1) */
  formWarning: [150, 80, 150],
  /** Rung liên hồi khẩn cấp khi có nguy cơ chấn thương (Danger - severity 2) */
  formDanger: [250, 100, 250, 100, 250],
} as const;

export function isHapticSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    "vibrate" in navigator &&
    typeof navigator.vibrate === "function"
  );
}

export function triggerHaptic(pattern: number | readonly number[]): boolean {
  if (!isHapticSupported()) {
    return false;
  }
  try {
    return navigator.vibrate(pattern as VibratePattern);
  } catch {
    // Trình duyệt có thể từ chối rung nếu chưa có tương tác người dùng
    return false;
  }
}

export const hapticFeedback = {
  formDanger: () => triggerHaptic(HAPTIC_PATTERNS.formDanger),
  formWarning: () => triggerHaptic(HAPTIC_PATTERNS.formWarning),
  isSupported: isHapticSupported,
  repSuccess: () => triggerHaptic(HAPTIC_PATTERNS.repSuccess),
  setComplete: () => triggerHaptic(HAPTIC_PATTERNS.setComplete),
  vibrate: triggerHaptic,
};
