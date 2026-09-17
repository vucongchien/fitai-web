let ExpoHaptics: typeof import("expo-haptics") | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ExpoHaptics = require("expo-haptics");
} catch {
  ExpoHaptics = null;
}

export const nativeHaptics = {
  repSuccess: async (): Promise<boolean> => {
    if (!ExpoHaptics) return false;
    try {
      await ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light);
      return true;
    } catch {
      return false;
    }
  },

  setComplete: async (): Promise<boolean> => {
    if (!ExpoHaptics) return false;
    try {
      await ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Success);
      return true;
    } catch {
      return false;
    }
  },

  formWarning: async (): Promise<boolean> => {
    if (!ExpoHaptics) return false;
    try {
      await ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Warning);
      return true;
    } catch {
      return false;
    }
  },

  formDanger: async (): Promise<boolean> => {
    if (!ExpoHaptics) return false;
    try {
      await ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Error);
      return true;
    } catch {
      return false;
    }
  },

  isSupported: (): boolean => {
    return ExpoHaptics !== null;
  },
};
