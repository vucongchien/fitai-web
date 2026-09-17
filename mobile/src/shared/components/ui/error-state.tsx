import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { theme } from "../../constants/theme";

export interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  title?: string;
}

export function ErrorState({ message, onRetry, title = "Đã xảy ra sự cố" }: ErrorStateProps) {
  return (
    <View accessibilityRole="alert" style={styles.container} testID="error-state">
      <View style={styles.iconContainer}>
        <Text style={styles.iconText}>⚠️</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? (
        <Pressable
          accessibilityLabel="Thử lại"
          accessibilityRole="button"
          onPress={onRetry}
          style={({ pressed }) => [styles.retryButton, pressed && styles.retryButtonPressed]}
        >
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.surface,
    borderWidth: 1,
    justifyContent: "center",
    margin: theme.spacing[4],
    padding: theme.spacing[6],
  },
  iconContainer: {
    marginBottom: theme.spacing[3],
  },
  iconText: {
    fontSize: 32,
  },
  message: {
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: theme.spacing[4],
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: theme.colors.relayBlue,
    borderRadius: theme.radius.input,
    paddingHorizontal: theme.spacing[5],
    paddingVertical: theme.spacing[2],
  },
  retryButtonPressed: {
    opacity: 0.8,
  },
  retryButtonText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  title: {
    color: theme.colors.danger,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: theme.spacing[2],
    textAlign: "center",
  },
});
