import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { theme } from "../../constants/theme";

export interface LoadingStateProps {
  color?: string;
  fullscreen?: boolean;
  message?: string;
}

export function LoadingState({
  color = theme.colors.relayBlue,
  fullscreen = false,
  message = "Đang tải dữ liệu...",
}: LoadingStateProps) {
  return (
    <View
      accessibilityLabel={message}
      accessibilityRole="progressbar"
      style={[styles.container, fullscreen && styles.fullscreen]}
      testID="loading-state"
    >
      <ActivityIndicator color={color} size="large" />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing[6],
  },
  fullscreen: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  message: {
    color: theme.colors.textMuted,
    fontSize: 14,
    marginTop: theme.spacing[3],
    textAlign: "center",
  },
});
