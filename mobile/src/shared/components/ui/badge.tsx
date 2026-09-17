import React from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { StyleSheet, Text, View } from "react-native";

import { theme } from "../../constants/theme";

export type BadgeVariant = "danger" | "primary" | "success" | "warning";

export interface BadgeProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  variant?: BadgeVariant;
}

export function Badge({ children, style, testID = "badge", variant = "primary" }: BadgeProps) {
  return (
    <View style={[styles.badge, styles[variant], style]} testID={testID}>
      <Text style={[styles.text, textStyles[variant]]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: theme.radius.round,
    paddingHorizontal: theme.spacing[3],
    paddingVertical: 4,
  },
  danger: {
    backgroundColor: "rgba(201, 47, 66, 0.15)",
    borderColor: "rgba(201, 47, 66, 0.3)",
    borderWidth: 1,
  },
  primary: {
    backgroundColor: "rgba(75, 87, 242, 0.15)",
    borderColor: "rgba(75, 87, 242, 0.3)",
    borderWidth: 1,
  },
  success: {
    backgroundColor: "rgba(37, 199, 122, 0.15)",
    borderColor: "rgba(37, 199, 122, 0.3)",
    borderWidth: 1,
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
  },
  warning: {
    backgroundColor: "rgba(255, 90, 71, 0.15)",
    borderColor: "rgba(255, 90, 71, 0.3)",
    borderWidth: 1,
  },
});

const textStyles = StyleSheet.create({
  danger: {
    color: theme.colors.danger,
  },
  primary: {
    color: theme.colors.relayBlue,
  },
  success: {
    color: theme.colors.fieldGreen,
  },
  warning: {
    color: theme.colors.sprintCoral,
  },
});
