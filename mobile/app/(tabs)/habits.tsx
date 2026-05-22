import React, { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ScreenBackground from "../../src/components/ScreenBackground";
import Header from "../../src/components/Header";
import Card from "../../src/components/Card";
import GradientButton from "../../src/components/GradientButton";
import Icon from "../../src/components/Icon";
import { computeStreak, today, useAppStore, Habit } from "../../src/store/useAppStore";
import { space, typography } from "../../src/theme";
import { HABIT_ICONS } from "../../src/components/Icon";
import { useTheme } from "../../src/ThemeContext";

const PRESETS = [
  { name: "Workout", icon: "gym", unit: "session", goal: 1, category: "Fitness" },
  { name: "Walk 10k Steps", icon: "walk", unit: "steps", goal: 10000, category: "Fitness" },
  { name: "Drink Water", icon: "water", unit: "glasses", goal: 8, category: "Health" },
  { name: "Read", icon: "book", unit: "pages", goal: 20, category: "Growth" },
  { name: "Sleep 8h", icon: "sleep", unit: "hours", goal: 8, category: "Health" },
  { name: "Journal", icon: "journal", unit: "entry", goal: 1, category: "Mind" },
  { name: "Meditate", icon: "meditate", unit: "minutes", goal: 10, category: "Mind" },
  { name: "Learn Code", icon: "code", unit: "minutes", goal: 30, category: "Growth" }
];

const CATEGORIES = ["General", "Fitness", "Health", "Mind", "Growth", "Diet", "Work", "Social"];

export default function HabitsScreen() {
  const { state, addHabit, updateHabit, deleteHabit, toggleHabit } = useAppStore();
  const { colors } = useTheme();
  const todayKey = today();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ name: "", icon: "spark", goal: "1", unit: "times", category: "General" });

  const submit = () => {
    if (!draft.name.trim()) return;
    if (editingId) {
      updateHabit(editingId, { name: draft.name.trim(), icon: draft.icon, goal: Number(draft.goal) || 1, unit: draft.unit, category: draft.category });
      setEditingId(null);
    } else {
      addHabit({ ...draft, goal: Number(draft.goal) || 1 });
    }
    setDraft({ name: "", icon: "spark", goal: "1", unit: "times", category: "General" });
  };

  const startEdit = (h: Habit) => {
    setEditingId(h.id);
    setDraft({ name: h.name, icon: h.icon, goal: String(h.goal), unit: h.unit, category: h.category });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft({ name: "", icon: "spark", goal: "1", unit: "times", category: "General" });
  };

  const remove = (id: string, name: string) => {
    Alert.alert("Delete habit", `Remove "${name}"? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteHabit(id) }
    ]);
  };

  return (
    <ScreenBackground>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <Header title="Habits" />
        <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md, paddingBottom: 140 }}>
          <View>
            <Text style={[typography.h1, { color: colors.ink }]}>Habits</Text>
            <Text style={{ color: colors.muted }}>Build any habit. Daily, weekly, or monthly cadence.</Text>
          </View>

          {/* Create/Edit form */}
          <Card>
            <Text style={[typography.h2, { color: colors.ink }]}>{editingId ? "Edit habit" : "Create a habit"}</Text>

            <Text style={[styles.label, { color: colors.ink }]}>Habit name</Text>
            <TextInput
              value={draft.name}
              onChangeText={(v) => setDraft({ ...draft, name: v })}
              placeholder="e.g. Morning run, Read 20 pages"
              placeholderTextColor={colors.muted}
              style={[styles.input, { backgroundColor: colors.surface2, borderColor: colors.line, color: colors.ink }]}
            />

            <View style={{ flexDirection: "row", gap: space.sm }}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: colors.ink }]}>Goal</Text>
                <TextInput
                  value={String(draft.goal)}
                  onChangeText={(v) => setDraft({ ...draft, goal: v.replace(/[^0-9]/g, "") || "1" })}
                  keyboardType="number-pad"
                  style={[styles.input, { backgroundColor: colors.surface2, borderColor: colors.line, color: colors.ink }]}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: colors.ink }]}>Unit</Text>
                <TextInput
                  value={draft.unit}
                  onChangeText={(v) => setDraft({ ...draft, unit: v })}
                  placeholder="glasses, pages…"
                  placeholderTextColor={colors.muted}
                  style={[styles.input, { backgroundColor: colors.surface2, borderColor: colors.line, color: colors.ink }]}
                />
              </View>
            </View>

            <Text style={[styles.label, { color: colors.ink }]}>Category</Text>
            <View style={styles.chipRow}>
              {CATEGORIES.map((c) => {
                const active = draft.category === c;
                return (
                  <Pressable key={c} onPress={() => setDraft({ ...draft, category: c })} style={[styles.chip, { borderColor: active ? colors.cyan : colors.line, backgroundColor: active ? "rgba(34,211,238,0.15)" : colors.surface2 }]}>
                    <Text style={[typography.small, { color: active ? colors.ink : colors.muted, fontWeight: "700" }]}>{c}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.label, { color: colors.ink }]}>Icon</Text>
            <View style={styles.chipRow}>
              {HABIT_ICONS.map((i) => {
                const active = draft.icon === i;
                return (
                  <Pressable key={i} onPress={() => setDraft({ ...draft, icon: i })} style={[styles.iconChip, { borderColor: active ? colors.cyan : colors.line, backgroundColor: active ? "rgba(34,211,238,0.15)" : colors.surface2 }]}>
                    <Icon name={i} size={18} color={active ? colors.cyan : colors.muted} />
                  </Pressable>
                );
              })}
            </View>

            <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: space.sm, marginTop: space.md }}>
              {editingId && <GradientButton title="Cancel" variant="ghost" onPress={cancelEdit} />}
              <GradientButton title={editingId ? "Save changes" : "+ Add habit"} onPress={submit} />
            </View>

            {!editingId && (
              <View style={{ marginTop: space.md, gap: 6 }}>
                <Text style={[typography.small, { color: colors.muted }]}>Quick presets</Text>
                <View style={styles.chipRow}>
                  {PRESETS.map((p) => (
                    <Pressable key={p.name} onPress={() => addHabit(p as any)} style={[styles.chip, { borderColor: colors.line, backgroundColor: colors.surface2 }]}>
                      <Icon name={p.icon} size={14} color={colors.muted} />
                      <Text style={[typography.small, { color: colors.ink, fontWeight: "600" }]}>{p.name}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </Card>

          {/* Habit list */}
          <Card>
            <Text style={[typography.h2, { color: colors.ink }]}>Your habits ({state.habits.length})</Text>
            <Text style={[typography.small, { marginBottom: space.sm, color: colors.muted }]}>Tap circle to log. Pencil to edit.</Text>
            <View style={{ gap: 8 }}>
              {state.habits.map((h) => {
                const done = (h.logs?.[todayKey] || 0) >= h.goal;
                const streak = computeStreak(h);
                return (
                  <View key={h.id} style={[styles.habitRow, { borderColor: colors.line }]}>
                    <Pressable
                      onPress={() => toggleHabit(h.id)}
                      style={[styles.check, { borderColor: h.color, backgroundColor: done ? h.color : "transparent" }]}
                    >
                      {done && <Icon name="check" size={14} color={colors.onGrad} />}
                    </Pressable>
                    <View style={[styles.iconBubble, { backgroundColor: `${h.color}26` }]}>
                      <Icon name={h.icon} size={16} color={h.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[typography.body, { color: colors.ink }]}>{h.name}</Text>
                      <Text style={[typography.small, { color: colors.muted }]}>{h.goal} {h.unit} · {h.category} · streak {streak}d</Text>
                    </View>
                    <Pressable onPress={() => startEdit(h)} hitSlop={8} style={styles.iconBtn}>
                      <Icon name="edit" size={16} color={colors.cyan} />
                    </Pressable>
                    <Pressable onPress={() => remove(h.id, h.name)} hitSlop={8} style={styles.iconBtn}>
                      <Icon name="trash" size={16} color={colors.danger} />
                    </Pressable>
                  </View>
                );
              })}
              {state.habits.length === 0 && <Text style={{ color: colors.muted }}>No habits yet.</Text>}
            </View>
          </Card>
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 12, marginTop: space.sm, marginBottom: 4 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 999, borderWidth: StyleSheet.hairlineWidth
  },
  iconChip: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth
  },
  habitRow: {
    flexDirection: "row", alignItems: "center", gap: space.sm,
    paddingVertical: 10, paddingHorizontal: 10,
    borderRadius: 12, backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: StyleSheet.hairlineWidth
  },
  check: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  iconBubble: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  iconBtn: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" }
});
