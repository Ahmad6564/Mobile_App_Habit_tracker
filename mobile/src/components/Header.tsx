import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import BrandMark from "./BrandMark";
import Icon from "./Icon";
import { useDrawer } from "./Drawer";
import { palette, space, typography } from "../theme";
import { useAppStore } from "../store/useAppStore";
import { useTheme } from "../ThemeContext";

type Props = {
  title?: string;
  showBrand?: boolean;
  back?: boolean;
};

export default function Header({ title, showBrand = true, back }: Props) {
  const router = useRouter();
  const { state, toggleTheme } = useAppStore();
  const { colors } = useTheme();
  const isDark = state.settings?.theme !== "light";
  const { open } = useDrawer();

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  };

  return (
    <View style={[styles.bar, { backgroundColor: isDark ? "rgba(11,16,32,0.45)" : "rgba(255,255,255,0.7)", borderBottomColor: colors.line }]}>
      <View style={styles.left}>
        {back ? (
          <Pressable onPress={goBack} style={styles.iconBtn} hitSlop={10}>
            <Icon name="arrowRight" size={20} color={colors.ink} />
          </Pressable>
        ) : (
          <Pressable onPress={open} style={styles.iconBtn} hitSlop={10}>
            <Icon name="menu" size={22} color={colors.ink} />
          </Pressable>
        )}
        {showBrand && <BrandMark size={28} />}
        <Text style={[styles.title, { color: colors.ink }]} numberOfLines={1} ellipsizeMode="tail">{title || "HabitForge"}</Text>
      </View>
      <View style={styles.right}>
        <Pressable onPress={toggleTheme} style={styles.iconBtn} hitSlop={10}>
          <Icon name={isDark ? "sun" : "moon"} size={18} color={colors.ink} />
        </Pressable>
        <Pressable onPress={() => router.push("/(tabs)/profile" as any)} style={[styles.avatar, { backgroundColor: colors.violet }]} hitSlop={6}>
          <Text style={[styles.avatarTxt, { color: colors.onGrad }]}>{(state.profile.name || "U").charAt(0).toUpperCase()}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    backgroundColor: "rgba(11,16,32,0.45)",
    borderBottomColor: palette.line,
    borderBottomWidth: StyleSheet.hairlineWidth
  },
  left: { flexDirection: "row", alignItems: "center", gap: space.xs, flex: 1, overflow: "hidden" },
  title: { ...typography.h3, flexShrink: 1 },
  right: { flexDirection: "row", alignItems: "center", gap: space.xs, marginLeft: space.sm },
  iconBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 10 },
  avatar: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: "center", justifyContent: "center",
    backgroundColor: palette.violet
  },
  avatarTxt: { color: palette.onGrad, fontWeight: "900" }
});
