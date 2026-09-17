import React from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

import { theme } from "../../constants/theme";
import { nativeHaptics } from "../../lib/haptics";

export type ButtonVariant = "danger" | "primary" | "quiet" | "secondary";
export type ButtonSize = "large" | "medium";

export interface ButtonProps {
  children: React.ReactNode;
  disabled?: boolean;
  hapticFeedback?: boolean;
  loading?: boolean;
  onPress?: () => void;
  size?: ButtonSize;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  variant?: ButtonVariant;
}

export function Button({
  children,
  disabled = false,
  hapticFeedback = true,
  loading = false,
  onPress,
  size = "medium",
  style,
  testID = "button",
  variant = "primary",
}: ButtonProps) {
  const handlePress = () => {
    if (disabled || loading) {
      return;
    }
    if (hapticFeedback) {
      void nativeHaptics.repSuccess();
    }
    onPress?.();
  };

  const isInteractive = !disabled && !loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !isInteractive }}
      disabled={!isInteractive}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        styles[size],
        pressed && isInteractive && styles.pressed,
        !isInteractive && styles.disabled,
        style,
      ]}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? "#ffffff" : theme.colors.relayBlue}
          size="small"
        />
      ) : (
        <Text style={[textStyles[variant], sizeTextStyles[size]]}>{children}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    borderRadius: theme.radius.input,
    flexDirection: "row",
    justifyContent: "center",
  },
  danger: {
    backgroundColor: theme.colors.danger,
  },
  disabled: {
    opacity: 0.5,
  },
  large: {
    minHeight: 52,
    paddingHorizontal: theme.spacing[6],
    paddingVertical: theme.spacing[3],
  },
  medium: {
    minHeight: 44,
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[2],
  },
  pressed: {
    opacity: 0.8,
  },
  primary: {
    backgroundColor: theme.colors.relayBlue,
  },
  quiet: {
    backgroundColor: "transparent",
  },
  secondary: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderColor: theme.colors.border,
    borderWidth: 1,
  },
});

const textStyles = StyleSheet.create({
  danger: {
    color: "#ffffff",
  },
  primary: {
    color: "#ffffff",
  },
  quiet: {
    color: theme.colors.textMuted,
  },
  secondary: {
    color: theme.colors.text,
  },
});

const sizeTextStyles = StyleSheet.create({
  large: {
    fontSize: 16,
    fontWeight: "700",
  },
  medium: {
    fontSize: 14,
    fontWeight: "600",
  },
});
