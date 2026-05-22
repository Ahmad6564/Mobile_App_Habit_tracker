import React from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import ScreenBackground from "../src/components/ScreenBackground";
import Header from "../src/components/Header";
import Card from "../src/components/Card";
import GradientButton from "../src/components/GradientButton";
import Icon from "../src/components/Icon";
import { useTheme } from "../src/ThemeContext";
import { space } from "../src/theme";
import { useAppStore } from "../src/store/useAppStore";

export default function SettingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { state, updateSettings, toggleTheme } = useAppStore();
  const s = state.settings;

  return (
    <ScreenBackground>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <Header title="Settings" />
        <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md, paddingBottom: 80 }}>
          <Text style={{ fontSize: 22, fontWeight: "800", color: colors.ink }}>Settings</Text>

          <Card>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.ink }}>Appearance</Text>
            <View style={{ flexDirection: "row", gap: space.sm, marginTop: space.sm }}>
              <Pressable onPress={toggleTheme} style={[styles.themeChip, { backgroundColor: s.theme === "dark" ? "rgba(34,211,238,0.15)" : colors.surface2, borderColor: s.theme === "dark" ? colors.cyan : colors.line }]}>
                <Icon name="moon" size={16} color={colors.ink} />
                <Text style={{ fontSize: 14, color: colors.ink }}>Dark</Text>
              </Pressable>
              <Pressable onPress={toggleTheme} style={[styles.themeChip, { backgroundColor: s.theme === "light" ? "rgba(34,211,238,0.15)" : colors.surface2, borderColor: s.theme === "light" ? colors.cyan : colors.line }]}>
                <Icon name="sun" size={16} color={colors.ink} />
                <Text style={{ fontSize: 14, color: colors.ink }}>Light</Text>
              </Pressable>
            </View>
          </Card>

          <Card>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.ink }}>Notifications</Text>
            <Text style={{ fontSize: 12, color: colors.muted, marginVertical: space.xs }}>
              We will remind you before midnight if you've missed any habit today and ping you when a task is due.
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: space.sm }}>
              <Text style={{ fontSize: 14, color: colors.ink }}>Send reminders</Text>
              <Switch
                value={s.notifications}
                onValueChange={(v) => updateSettings({ notifications: v })}
                trackColor={{ true: colors.cyan, false: "#444" }}
                thumbColor={colors.ink}
              />
            </View>
            <Text style={{ fontSize: 12, color: colors.ink, marginTop: space.sm, marginBottom: 4 }}>Reminder time (HH:MM)</Text>
            <TextInput value={s.reminderTime} onChangeText={(v) => updateSettings({ reminderTime: v })} placeholder="21:30" placeholderTextColor={colors.muted} style={[styles.input, { backgroundColor: colors.surface2, borderColor: colors.line, color: colors.ink }]} />
          </Card>

          <Card>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.ink }}>Privacy</Text>
            <Text style={{ fontSize: 12, color: colors.ink, marginTop: space.sm, marginBottom: 4 }}>Profile visibility</Text>
            <View style={{ flexDirection: "row", gap: 6, marginTop: 4 }}>
              {(["public", "followers", "private"] as const).map((p) => {
                const active = s.privacy === p;
                return (
                  <Pressable key={p} onPress={() => updateSettings({ privacy: p })} style={[styles.chip, { backgroundColor: active ? "rgba(34,211,238,0.15)" : colors.surface2, borderColor: active ? colors.cyan : colors.line }]}>
                    <Text style={{ fontSize: 12, color: active ? colors.ink : colors.muted, fontWeight: "700" }}>{p}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={{ fontSize: 12, color: colors.ink, marginTop: space.sm, marginBottom: 4 }}>Daily calorie target</Text>
            <TextInput
              value={String(s.calorieTarget)}
              onChangeText={(v) => updateSettings({ calorieTarget: Number(v.replace(/[^0-9]/g, "")) || 2000 })}
              keyboardType="number-pad"
              style={[styles.input, { backgroundColor: colors.surface2, borderColor: colors.line, color: colors.ink }]}
            />
          </Card>
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  themeChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth },
  input: { borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, paddingVertical: 12, borderRadius: 10 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth }
});
