/**
 * Native Keep Awake Utility cho Expo Mobile.
 * Giữ màn hình sáng liên tục trong suốt phiên tập luyện workout.
 * Bọc expo-keep-awake an toàn trong môi trường SSR/Test/Web.
 */

let ExpoKeepAwake: typeof import("expo-keep-awake") | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ExpoKeepAwake = require("expo-keep-awake");
} catch {
  ExpoKeepAwake = null;
}

const WORKOUT_KEEP_AWAKE_TAG = "fitai_workout_session";

export const nativeKeepAwake = {
  /** Yêu cầu giữ sáng màn hình khi bắt đầu tập */
  activate: async (tag = WORKOUT_KEEP_AWAKE_TAG): Promise<boolean> => {
    if (!ExpoKeepAwake) return false;
    try {
      await ExpoKeepAwake.activateKeepAwakeAsync(tag);
      return true;
    } catch {
      return false;
    }
  },

  /** Tắt chế độ giữ sáng màn hình khi kết thúc hoặc tạm dừng */
  deactivate: async (tag = WORKOUT_KEEP_AWAKE_TAG): Promise<boolean> => {
    if (!ExpoKeepAwake) return false;
    try {
      await ExpoKeepAwake.deactivateKeepAwake(tag);
      return true;
    } catch {
      return false;
    }
  },

  /** Kiểm tra module keep-awake có khả dụng không */
  isSupported: (): boolean => {
    return ExpoKeepAwake !== null;
  },
};
