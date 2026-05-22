import React, { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ScreenBackground from "../src/components/ScreenBackground";
import Header from "../src/components/Header";
import Card from "../src/components/Card";
import GradientButton from "../src/components/GradientButton";
import Icon from "../src/components/Icon";
import { space, typography } from "../src/theme";
import { useTheme } from "../src/ThemeContext";
import { today, useAppStore, Task } from "../src/store/useAppStore";

const PRIORITIES: Task["priority"][] = ["low", "medium", "high"];
const PRI_COLOR: Record<Task["priority"], string> = { low: "#34d399", medium: "#fbbf24", high: "#fb7185" };

function formatGroup(key: string) {
  if (!key) return "No date";
  const t = today();
  if (key === t) return "Today";
  const d = new Date(key + "T00:00:00");
  const tom = new Date(); tom.setDate(tom.getDate() + 1);
  const tomKey = tom.toISOString().slice(0, 10);
  if (key === tomKey) return "Tomorrow";
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export default function TasksScreen() {
  const { state, addTask, updateTask, toggleTask, deleteTask } = useAppStore();
  const { colors } = useTheme();
  const todayKey = today();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ title: "", notes: "", due: todayKey, priority: "medium" as Task["priority"] });
  const [filter, setFilter] = useState<"all" | "today" | "overdue" | "open" | "done">("all");

  const counts = {
    all: state.tasks.length,
    open: state.tasks.filter((t) => !t.done).length,
    today: state.tasks.filter((t) => t.due === todayKey && !t.done).length,
    overdue: state.tasks.filter((t) => t.due < todayKey && !t.done).length,
    done: state.tasks.filter((t) => t.done).length
  } as const;

  const filtered = state.tasks.filter((t) => {
    if (filter === "open") return !t.done;
    if (filter === "done") return t.done;
    if (filter === "today") return t.due === todayKey && !t.done;
    if (filter === "overdue") return t.due < todayKey && !t.done;
    return true;
  });

  const grouped = useMemo(() => {
    const groups: Record<string, Task[]> = {};
    filtered.forEach((t) => {
      const k = t.done ? "done" : t.due || "none";
      (groups[k] ||= []).push(t);
    });
    return Object.keys(groups).sort((a, b) => {
      if (a === "done") return 1; if (b === "done") return -1; return a.localeCompare(b);
    }).map((k) => ({ key: k, items: groups[k] }));
  }, [filtered]);

  const submit = () => {
    if (!draft.title.trim()) return;
    if (editingId) {
      updateTask(editingId, { title: draft.title.trim(), notes: draft.notes, due: draft.due, priority: draft.priority });
      setEditingId(null);
    } else {
      addTask(draft);
    }
    setDraft({ title: "", notes: "", due: todayKey, priority: "medium" });
  };

  const startEdit = (t: Task) => {
    setEditingId(t.id);
    setDraft({ title: t.title, notes: t.notes, due: t.due, priority: t.priority });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft({ title: "", notes: "", due: todayKey, priority: "medium" });
  };

  const remove = (id: string) => {
    Alert.alert("Delete task", "Remove this task?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteTask(id) }
    ]);
  };

  return (
    <ScreenBackground>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <Header title="Tasks" />
        <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md, paddingBottom: 80 }}>
          <View>
            <Text style={[typography.h1, { color: colors.ink }]}>Tasks</Text>
            <Text style={{ color: colors.muted }}>Quick to-dos alongside your habits.</Text>
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {(["all", "today", "overdue", "open", "done"] as const).map((f) => (
              <Pressable key={f} onPress={() => setFilter(f)} style={[styles.tab, { borderColor: filter === f ? colors.cyan : colors.line, backgroundColor: filter === f ? "rgba(34,211,238,0.15)" : colors.surface2 }]}>
                <Text style={[typography.small, { color: filter === f ? colors.ink : colors.muted, fontWeight: "700" }]}>
                  {f} <Text style={{ color: colors.muted }}>{counts[f]}</Text>
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={{ flexDirection: "row", gap: space.sm }}>
            <Stat label="Open" value={counts.open} colors={colors} />
            <Stat label="Overdue" value={counts.overdue} color="#fb7185" colors={colors} />
            <Stat label="Today" value={counts.today} colors={colors} />
            <Stat label="Done" value={counts.done} color="#34d399" colors={colors} />
          </View>

          <Card>
            <Text style={[typography.h2, { color: colors.ink }]}>{editingId ? "Edit task" : "New task"}</Text>

            <Text style={[styles.label, { color: colors.ink }]}>Title</Text>
            <TextInput value={draft.title} onChangeText={(v) => setDraft({ ...draft, title: v })} placeholder="e.g. Schedule dentist appointment" placeholderTextColor={colors.muted} style={[styles.input, { backgroundColor: colors.surface2, borderColor: colors.line, color: colors.ink }]} />

            <Text style={[styles.label, { color: colors.ink }]}>Notes</Text>
            <TextInput value={draft.notes} onChangeText={(v) => setDraft({ ...draft, notes: v })} multiline numberOfLines={2} placeholder="Optional details" placeholderTextColor={colors.muted} style={[styles.input, { minHeight: 56, textAlignVertical: "top", backgroundColor: colors.surface2, borderColor: colors.line, color: colors.ink }]} />

            <View style={{ flexDirection: "row", gap: space.sm }}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: colors.ink }]}>Due (YYYY-MM-DD)</Text>
                <TextInput value={draft.due} onChangeText={(v) => setDraft({ ...draft, due: v })} placeholder="2026-05-22" placeholderTextColor={colors.muted} style={[styles.input, { backgroundColor: colors.surface2, borderColor: colors.line, color: colors.ink }]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: colors.ink }]}>Priority</Text>
                <View style={{ flexDirection: "row", gap: 6, marginTop: 4 }}>
                  {PRIORITIES.map((p) => {
                    const active = draft.priority === p;
                    return (
                      <Pressable key={p} onPress={() => setDraft({ ...draft, priority: p })} style={[styles.priChip, { borderColor: PRI_COLOR[p] + "88", backgroundColor: active ? PRI_COLOR[p] + "33" : "transparent" }]}>
                        <Text style={[typography.small, { color: PRI_COLOR[p], fontWeight: "700" }]}>{p}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>

            <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: space.sm, marginTop: space.md }}>
              {editingId && <GradientButton title="Cancel" variant="ghost" onPress={cancelEdit} />}
              <GradientButton title={editingId ? "Save changes" : "+ Add task"} onPress={submit} />
            </View>
          </Card>

          {grouped.length === 0 && <Text style={{ color: colors.muted }}>Nothing matches this filter.</Text>}
          {grouped.map((g) => (
            <Card key={g.key}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: space.sm }}>
                <Text style={[typography.h3, { color: colors.ink }]}>{g.key === "done" ? "Completed" : formatGroup(g.key)}</Text>
                <Text style={[typography.small, { color: colors.muted }]}>{g.items.length}</Text>
              </View>
              <View style={{ gap: 8 }}>
                {g.items.map((t) => {
                  const overdue = Boolean(!t.done && t.due && t.due < todayKey);
                  return (
                    <View key={t.id} style={[styles.taskRow, { borderColor: overdue ? "rgba(251,113,133,0.35)" : colors.line }]}>
                      <Pressable onPress={() => toggleTask(t.id)} style={[styles.check, { borderColor: t.done ? "#34d399" : colors.muted, backgroundColor: t.done ? "#34d399" : "transparent" }]}>
                        {t.done && <Icon name="check" size={14} color={colors.onGrad} />}
                      </Pressable>
                      <View style={{ flex: 1 }}>
                        <Text style={[typography.body, { color: colors.ink }, t.done && { textDecorationLine: "line-through", color: colors.muted }]}>{t.title}</Text>
                        {t.notes ? <Text style={[typography.small, { color: colors.muted }]}>{t.notes}</Text> : null}
                        <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
                          <View style={[styles.priPill, { backgroundColor: PRI_COLOR[t.priority] + "22" }]}>
                            <Text style={{ color: PRI_COLOR[t.priority], fontSize: 11, fontWeight: "700" }}>{t.priority}</Text>
                          </View>
                          {t.due ? <Text style={[typography.small, { color: overdue ? "#fb7185" : colors.muted }]}>📅 {formatGroup(t.due)}</Text> : null}
                        </View>
                      </View>
                      <Pressable onPress={() => startEdit(t)} hitSlop={8} style={{ padding: 4 }}>
                        <Icon name="edit" size={16} color={colors.cyan} />
                      </Pressable>
                      <Pressable onPress={() => remove(t.id)} hitSlop={8} style={{ padding: 4 }}>
                        <Icon name="trash" size={16} color={colors.danger} />
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            </Card>
          ))}
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

function Stat({ label, value, color, colors }: { label: string; value: number; color?: string; colors: any }) {
  return (
    <View style={[styles.statBox, { borderColor: color ? color + "55" : colors.line, backgroundColor: colors.surface }]}>
      <Text style={[typography.small, { color: colors.muted }]}>{label}</Text>
      <Text style={[typography.h2, { color: color || colors.ink }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tab: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth },
  statBox: { flex: 1, padding: space.sm, borderWidth: StyleSheet.hairlineWidth, borderRadius: 12 },
  label: { fontSize: 12, marginTop: space.sm, marginBottom: 4 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12, paddingVertical: 12, borderRadius: 10
  },
  priChip: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  taskRow: {
    flexDirection: "row", alignItems: "center", gap: space.sm,
    padding: 10, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: StyleSheet.hairlineWidth
  },
  check: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  priPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 }
});
