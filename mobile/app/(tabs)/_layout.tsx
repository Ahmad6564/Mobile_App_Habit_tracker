import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { Tabs } from "expo-router";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "../../src/components/Icon";
import { useTheme } from "../../src/ThemeContext";

export default function TabsLayout() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 12);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.cyan,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        tabBarHideOnKeyboard: true,
        tabBarStyle: [styles.tabBar, { backgroundColor: isDark ? "transparent" : "rgba(255,255,255,0.9)", height: 56 + bottomPad, paddingBottom: bottomPad }],
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView intensity={40} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? "rgba(11,16,32,0.92)" : "rgba(255,255,255,0.95)" }]} />
          )
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Home", tabBarIcon: ({ color }) => <Icon name="dashboard" color={color} size={22} /> }}
      />
      <Tabs.Screen
        name="coach"
        options={{ title: "AI Coach", tabBarIcon: ({ color }) => <Icon name="chat" color={color} size={22} /> }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{ title: "Nutrition", tabBarIcon: ({ color }) => <Icon name="nutrition" color={color} size={22} /> }}
      />
      <Tabs.Screen
        name="community"
        options={{ title: "Community", tabBarIcon: ({ color }) => <Icon name="community" color={color} size={22} /> }}
      />
      {/* Hidden from tab bar and tab bar hidden when active */}
      <Tabs.Screen
        name="habits"
        options={{ href: null, tabBarStyle: { display: "none" } }}
      />
      <Tabs.Screen
        name="calendar"
        options={{ href: null, tabBarStyle: { display: "none" } }}
      />
      <Tabs.Screen
        name="profile"
        options={{ href: null, tabBarStyle: { display: "none" } }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    borderTopColor: "rgba(255,255,255,0.08)",
    borderTopWidth: StyleSheet.hairlineWidth,
    backgroundColor: "transparent",
    elevation: 0,
    paddingTop: 6
  }
});
