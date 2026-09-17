import React from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { Pressable, StyleSheet, View } from "react-native";

import { theme } from "../../constants/theme";

export interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Card({ children, onPress, style, testID = "card" }: CardProps) {
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.card, pressed && styles.pressed, style]}
        testID={testID}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={[styles.card, style]} testID={testID}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.surface,
    borderWidth: 1,
    overflow: "hidden",
    padding: theme.spacing[4],
  },
  pressed: {
    opacity: 0.85,
  },
});
