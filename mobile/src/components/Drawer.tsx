import React, { useState, createContext, useContext } from "react";
import { Dimensions, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "./Icon";
import { palette, space, typography } from "../theme";
import { useTheme } from "../ThemeContext";

type DrawerCtx = { open: () => void; close: () => void };
const DrawerContext = createContext<DrawerCtx>({ open: () => {}, close: () => {} });

export function useDrawer() {
  return useContext(DrawerContext);
}

const MENU_ITEMS = [
  { label: "Habits", icon: "habit", route: "/(tabs)/habits" },
  { label: "Tasks", icon: "task", route: "/tasks" },
  { label: "Calendar", icon: "calendar", route: "/(tabs)/calendar" },
  { label: "Referral", icon: "community", route: "/referral" },
  { label: "Profile", icon: "user", route: "/(tabs)/profile" },
  { label: "Settings", icon: "settings", route: "/settings" },
];

export function DrawerProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const openDrawer = () => setVisible(true);
  const closeDrawer = () => setVisible(false);

  const navigate = (route: string) => {
    closeDrawer();
    setTimeout(() => router.push(route as any), 150);
  };

  return (
    <DrawerContext.Provider value={{ open: openDrawer, close: closeDrawer }}>
      {children}
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={closeDrawer}
        statusBarTranslucent
      >
        <View style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeDrawer} />
          <View style={[styles.drawer, { paddingTop: insets.top + 16, backgroundColor: isDark ? "#0d1328" : "#ffffff" }]}>
            <View style={styles.drawerHeader}>
              <Text style={[typography.h2, { color: colors.ink }]}>Menu</Text>
              <Pressable onPress={closeDrawer} hitSlop={10}>
                <Icon name="close" size={22} color={colors.ink} />
              </Pressable>
            </View>
            <ScrollView style={{ marginTop: space.lg }}>
              {MENU_ITEMS.map((item) => (
                <Pressable
                  key={item.label}
                  onPress={() => navigate(item.route)}
                  style={styles.menuItem}
                >
                  <View style={[styles.menuIcon, { backgroundColor: colors.surface2 }]}>
                    <Icon name={item.icon} size={20} color={colors.cyan} />
                  </View>
                  <Text style={[typography.body, { color: colors.ink }]}>{item.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </DrawerContext.Provider>
  );
}

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    flexDirection: "row"
  },
  drawer: {
    width: width * 0.72,
    paddingHorizontal: space.lg,
    paddingBottom: space.xxl,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 20,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 4, height: 0 }
  },
  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.06)"
  },
  menuIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center"
  }
});
