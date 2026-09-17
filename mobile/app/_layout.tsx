import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { theme } from "../src/shared/constants/theme";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            contentStyle: { backgroundColor: theme.colors.background },
            headerShown: false,
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)/login" />
          <Stack.Screen name="(auth)/onboarding" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="workout/live"
            options={{
              animation: "slide_from_bottom",
              presentation: "fullScreenModal",
            }}
          />
          <Stack.Screen
            name="workout/summary"
            options={{
              animation: "slide_from_right",
              presentation: "card",
            }}
          />
          <Stack.Screen
            name="nutrition/log-meal"
            options={{
              animation: "slide_from_bottom",
              presentation: "modal",
            }}
          />
          <Stack.Screen
            name="search/index"
            options={{
              animation: "slide_from_bottom",
              presentation: "modal",
            }}
          />
        </Stack>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
});
