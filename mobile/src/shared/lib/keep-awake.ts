let ExpoKeepAwake: typeof import("expo-keep-awake") | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ExpoKeepAwake = require("expo-keep-awake");
} catch {
  ExpoKeepAwake = null;
}

const WORKOUT_KEEP_AWAKE_TAG = "fitai_workout_session";

export const nativeKeepAwake = {
  activate: async (tag = WORKOUT_KEEP_AWAKE_TAG): Promise<boolean> => {
    if (!ExpoKeepAwake) return false;
    try {
      await ExpoKeepAwake.activateKeepAwakeAsync(tag);
      return true;
    } catch {
      return false;
    }
  },

  deactivate: async (tag = WORKOUT_KEEP_AWAKE_TAG): Promise<boolean> => {
    if (!ExpoKeepAwake) return false;
    try {
      await ExpoKeepAwake.deactivateKeepAwake(tag);
      return true;
    } catch {
      return false;
    }
  },

  isSupported: (): boolean => {
    return ExpoKeepAwake !== null;
  },
};
