import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import ScreenBackground from "../../src/components/ScreenBackground";
import Header from "../../src/components/Header";
import Card from "../../src/components/Card";
import GradientButton from "../../src/components/GradientButton";
import Icon from "../../src/components/Icon";
import { computeStreak, useAppStore } from "../../src/store/useAppStore";
import { useTheme } from "../../src/ThemeContext";
import { space } from "../../src/theme";

function calcAge(dob: string) {
  if (!dob) return null;
  const d = new Date(dob); if (isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}
function bmi(h: string, w: string) {
  const hm = Number(h) / 100; const wk = Number(w);
  if (!hm || !wk) return null;
  return (wk / (hm * hm)).toFixed(1);
}

export default function ProfileScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { state, updateProfile } = useAppStore();
  const [form, setForm] = useState(state.profile);
  const [saved, setSaved] = useState(false);
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    updateProfile(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const longestStreak = state.habits.reduce((m, h) => Math.max(m, computeStreak(h)), 0);
  const age = calcAge(state.profile.dob);
  const b = bmi(state.profile.heightCm, state.profile.weightKg);

  return (
    <ScreenBackground>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <Header title="Profile" />
        <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md, paddingBottom: 140 }}>
          <Card>
            <View style={{ flexDirection: "row", gap: space.md, alignItems: "center" }}>
              <View style={[styles.avatarBig, { backgroundColor: colors.violet }]}>  
                <Text style={{ color: "#fff", fontSize: 30, fontWeight: "900" }}>{(form.name || "U").charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 22, fontWeight: "800", color: colors.ink }}>{state.profile.name || "Your profile"}</Text>
                <Text style={{ fontSize: 12, color: colors.muted }}>@{state.profile.username || "you"} · {state.profile.country || "—"}</Text>
                <View style={styles.statRow}>
                  <Chip icon="habit" text={`${state.habits.length} habits`} colors={colors} />
                  <Chip icon="flame" text={`${longestStreak}d`} colors={colors} />
                  <Chip icon="community" text={`${state.posts.length} posts`} colors={colors} />
                  {age != null && <Chip icon="user" text={`${age} yrs`} colors={colors} />}
                  {b && <Chip icon="spark" text={`BMI ${b}`} colors={colors} />}
                </View>
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: space.sm, marginTop: space.md }}>
              <GradientButton title="Refer" left={<Icon name="refer" size={14} color={colors.ink} />} variant="ghost" onPress={() => router.push("/referral")} />
              <GradientButton title="Settings" left={<Icon name="settings" size={14} color={colors.ink} />} variant="ghost" onPress={() => router.push("/settings")} />
            </View>
          </Card>

          <Card>
            <Text style={{ fontSize: 18, fontWeight: "800", color: colors.ink }}>Personal info</Text>

            <Text style={{ fontSize: 12, color: colors.ink, marginTop: space.sm, marginBottom: 4 }}>Display name</Text>
            <TextInput value={form.name} onChangeText={(v) => set("name", v)} style={[styles.input, { backgroundColor: colors.surface2, borderColor: colors.line, color: colors.ink }]} placeholderTextColor={colors.muted} />

            <Text style={{ fontSize: 12, color: colors.ink, marginTop: space.sm, marginBottom: 4 }}>Username</Text>
            <TextInput value={form.username} onChangeText={(v) => set("username", v.replace(/\s/g, ""))} style={[styles.input, { backgroundColor: colors.surface2, borderColor: colors.line, color: colors.ink }]} placeholderTextColor={colors.muted} />

            <View style={{ flexDirection: "row", gap: space.sm }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: colors.ink, marginTop: space.sm, marginBottom: 4 }}>Country</Text>
                <TextInput value={form.country} onChangeText={(v) => set("country", v)} placeholder="PK, US, UK…" placeholderTextColor={colors.muted} style={[styles.input, { backgroundColor: colors.surface2, borderColor: colors.line, color: colors.ink }]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: colors.ink, marginTop: space.sm, marginBottom: 4 }}>Timezone</Text>
                <TextInput value={form.timezone} onChangeText={(v) => set("timezone", v)} style={[styles.input, { backgroundColor: colors.surface2, borderColor: colors.line, color: colors.ink }]} placeholderTextColor={colors.muted} />
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: space.sm }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: colors.ink, marginTop: space.sm, marginBottom: 4 }}>Height (cm)</Text>
                <TextInput value={form.heightCm} onChangeText={(v) => set("heightCm", v.replace(/[^0-9]/g, ""))} keyboardType="number-pad" style={[styles.input, { backgroundColor: colors.surface2, borderColor: colors.line, color: colors.ink }]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: colors.ink, marginTop: space.sm, marginBottom: 4 }}>Weight (kg)</Text>
                <TextInput value={form.weightKg} onChangeText={(v) => set("weightKg", v.replace(/[^0-9]/g, ""))} keyboardType="number-pad" style={[styles.input, { backgroundColor: colors.surface2, borderColor: colors.line, color: colors.ink }]} />
              </View>
            </View>

            <Text style={{ fontSize: 12, color: colors.ink, marginTop: space.sm, marginBottom: 4 }}>Bio</Text>
            <TextInput value={form.bio} onChangeText={(v) => set("bio", v)} multiline numberOfLines={3} placeholder="A short intro to your followers" placeholderTextColor={colors.muted} style={[styles.input, { backgroundColor: colors.surface2, borderColor: colors.line, color: colors.ink, minHeight: 70, textAlignVertical: "top" }]} />

            <Text style={{ fontSize: 12, color: colors.ink, marginTop: space.sm, marginBottom: 4 }}>What are you working on?</Text>
            <TextInput value={form.goalsStatement} onChangeText={(v) => set("goalsStatement", v)} multiline numberOfLines={3} placeholder="e.g. Run a 10k by August" placeholderTextColor={colors.muted} style={[styles.input, { backgroundColor: colors.surface2, borderColor: colors.line, color: colors.ink, minHeight: 70, textAlignVertical: "top" }]} />

            <View style={{ flexDirection: "row", justifyContent: "flex-end", alignItems: "center", gap: space.sm, marginTop: space.md }}>
              {saved && <Text style={{ fontSize: 12, color: colors.emerald }}>Saved ✓</Text>}
              <GradientButton title="Save profile" onPress={submit} />
            </View>
          </Card>
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

function Chip({ icon, text, colors }: { icon: string; text: string; colors: any }) {
  return (
    <View style={[styles.chip, { backgroundColor: colors.surface2, borderColor: colors.line }]}>
      <Icon name={icon} size={12} color={colors.cyan} />
      <Text style={{ fontSize: 12, color: colors.ink }}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatarBig: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: "center", justifyContent: "center"
  },
  statRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
  chip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12, paddingVertical: 12, borderRadius: 10
  }
});
