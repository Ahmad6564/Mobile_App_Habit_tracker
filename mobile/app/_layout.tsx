import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppStoreProvider } from "../src/store/useAppStore";
import { ThemeProvider, useTheme } from "../src/ThemeContext";
import { DrawerProvider } from "../src/components/Drawer";
import { palette } from "../src/theme";

function InnerLayout() {
  const { colors, isDark } = useTheme();
  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg0 },
          animation: "fade"
        }}
      />
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: palette.bg0 }}>
      <SafeAreaProvider>
        <AppStoreProvider>
          <ThemeProvider>
            <DrawerProvider>
              <InnerLayout />
            </DrawerProvider>
          </ThemeProvider>
        </AppStoreProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
