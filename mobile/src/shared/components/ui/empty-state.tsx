import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { theme } from "../../constants/theme";

export interface EmptyStateProps {
  action?: React.ReactNode;
  description?: string;
  icon?: string;
  title: string;
}

export function EmptyState({ action, description, icon = "📋", title }: EmptyStateProps) {
  return (
    <View style={styles.container} testID="empty-state">
      <View style={styles.iconContainer}>
        <Text style={styles.iconText}>{icon}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {action ? <View style={styles.actionContainer}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  actionContainer: {
    marginTop: theme.spacing[4],
  },
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
  description: {
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  iconContainer: {
    marginBottom: theme.spacing[3],
  },
  iconText: {
    fontSize: 32,
  },
  title: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: theme.spacing[2],
    textAlign: "center",
  },
});
