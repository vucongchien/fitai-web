import { Tabs } from "expo-router";
import React from "react";
import { StyleSheet, Text } from "react-native";

import { theme } from "../../src/shared/constants/theme";

function TabIcon({ focused, symbol }: { focused: boolean; symbol: string }) {
  return <Text style={[styles.icon, focused && styles.iconActive]}>{symbol}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.relayBlue,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tabs.Screen
        name="today"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} symbol="⚡" />,
          title: "Hôm nay",
        }}
      />
      <Tabs.Screen
        name="workout"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} symbol="🏋️" />,
          title: "Tập luyện",
        }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} symbol="🥗" />,
          title: "Dinh dưỡng",
        }}
      />
      <Tabs.Screen
        name="roadmap"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} symbol="📈" />,
          title: "Lộ trình",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} symbol="👤" />,
          title: "Cá nhân",
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  icon: {
    fontSize: 20,
    opacity: 0.6,
  },
  iconActive: {
    opacity: 1,
    transform: [{ scale: 1.1 }],
  },
  tabBar: {
    backgroundColor: theme.colors.surface,
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    elevation: 8,
    height: 60,
    paddingBottom: 6,
    paddingTop: 6,
  },
});
