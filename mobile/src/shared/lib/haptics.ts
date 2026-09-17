/**
 * Native Haptic Feedback Utility cho Expo Mobile.
 * Bọc expo-haptics với interface đồng nhất cho workout session.
 * An toàn khi chạy trên Simulator, Web fallback hoặc môi trường test.
 */

// Dynamic import an toàn để tương thích môi trường Node / Vitest
let ExpoHaptics: typeof import("expo-haptics") | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ExpoHaptics = require("expo-haptics");
} catch {
  ExpoHaptics = null;
}

export const nativeHaptics = {
  /** Rung nhẹ khi đếm thành công 1 rep (Light impact) */
  repSuccess: async (): Promise<boolean> => {
    if (!ExpoHaptics) return false;
    try {
      await ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light);
      return true;
    } catch {
      return false;
    }
  },

  /** Rung chúc mừng khi hoàn thành trọn vẹn 1 set (Success notification) */
  setComplete: async (): Promise<boolean> => {
    if (!ExpoHaptics) return false;
    try {
      await ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Success);
      return true;
    } catch {
      return false;
    }
  },

  /** Rung cảnh báo khi sai tư thế (Warning notification) */
  formWarning: async (): Promise<boolean> => {
    if (!ExpoHaptics) return false;
    try {
      await ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Warning);
      return true;
    } catch {
      return false;
    }
  },

  /** Rung khẩn cấp khi có nguy cơ chấn thương (Error notification) */
  formDanger: async (): Promise<boolean> => {
    if (!ExpoHaptics) return false;
    try {
      await ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Error);
      return true;
    } catch {
      return false;
    }
  },

  /** Kiểm tra module haptic có khả dụng không */
  isSupported: (): boolean => {
    return ExpoHaptics !== null;
  },
};
