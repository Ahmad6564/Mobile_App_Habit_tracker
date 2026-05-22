import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import ScreenBackground from "../../src/components/ScreenBackground";
import Header from "../../src/components/Header";
import Card from "../../src/components/Card";
import GradientButton from "../../src/components/GradientButton";
import DonutChart from "../../src/components/DonutChart";
import HabitMatrix from "../../src/components/HabitMatrix";
import Icon from "../../src/components/Icon";
import { space } from "../../src/theme";
import { useTheme } from "../../src/ThemeContext";
import { today, useAppStore } from "../../src/store/useAppStore";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function Dashboard() {
  const router = useRouter();
  const { colors } = useTheme();
  const { state, goPrevMonth, goNextMonth, goThisMonth, toggleHabit } = useAppStore();
  const { habits, tasks, viewYear, viewMonth } = state;
  const todayKey = today();
  const now = new Date();
  const isCurrent = now.getFullYear() === viewYear && now.getMonth() === viewMonth;

  // Stats computed directly (no useMemo to ensure real-time updates)
  const todayHabitsDone = habits.filter((h) => (h.logs?.[todayKey] || 0) >= h.goal).length;
  const todayTasksDone = tasks.filter((t) => t.due === todayKey && t.done).length;
  const todayTasksTotal = tasks.filter((t) => t.due === todayKey).length;
  const todayItemsDone = todayHabitsDone + todayTasksDone;
  const todayItemsTotal = habits.length + todayTasksTotal;

  // Monthly pie chart: sum of all done / sum of all goals * 100 (always current month)
  const curYear = now.getFullYear();
  const curMonth = now.getMonth();
  const daysInMonth = new Date(curYear, curMonth + 1, 0).getDate();
  let sumGoals = 0;
  let sumDone = 0;
  habits.forEach((h) => {
    let done = 0;
    for (let d = 1; d <= daysInMonth; d += 1) {
      const k = `${curYear}-${String(curMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      if ((h.logs?.[k] || 0) >= h.goal) done += 1;
    }
    sumDone += done;
    sumGoals += h.goal;
  });
  const monthAvg = sumGoals ? Math.round((sumDone / sumGoals) * 100) : 0;

  // Top habits: done = days completed in current month, total = habit's goal, pct = done/goal * 100
  const topHabits = [...habits]
    .map((h) => {
      let done = 0;
      for (let d = 1; d <= daysInMonth; d += 1) {
        const k = `${curYear}-${String(curMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        if ((h.logs?.[k] || 0) >= h.goal) done += 1;
      }
      const total = h.goal;
      const pct = total ? Math.round((done / total) * 100) : 0;
      return { ...h, pct, done, total };
    })
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 5);

  const openTasks = tasks.filter((t) => !t.done).length;

  return (
    <ScreenBackground>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <Header />
        <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md, paddingBottom: 140 }}>
          {/* Month bar */}
          <Card>
            <Text style={{ fontSize: 11, color: colors.cyan, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase" }}>Habit Tracker</Text>
            <Text style={{ fontSize: 28, fontWeight: "800", color: colors.ink, letterSpacing: -0.5, marginTop: 4 }}>
              {MONTHS[viewMonth]} <Text style={{ color: colors.muted }}>{viewYear}</Text>
            </Text>

            <View style={styles.monthNav}>
              <GradientButton title="◀ Prev" variant="ghost" size="sm" onPress={goPrevMonth} />
              {!isCurrent && <GradientButton title="This Month" variant="ghost" size="sm" onPress={goThisMonth} />}
              <GradientButton title="Next ▶" variant="ghost" size="sm" onPress={goNextMonth} />
            </View>

            <View style={styles.metaRow}>
              <Meta label="Habits" value={String(habits.length)} />
              <Meta label="Tasks" value={String(openTasks)} />
              <Meta label="Month avg" value={`${monthAvg}%`} />
            </View>

            <View style={styles.actionRow}>
              <GradientButton title="+ Habit" onPress={() => router.push("/(tabs)/habits")} />
              <GradientButton title="+ Task" variant="ghost" onPress={() => router.push("/tasks")} />
            </View>
          </Card>

          {/* Daily Matrix mini (today's row) */}
          <Card>
            <View style={styles.headRow}>
              <Text style={{ fontSize: 18, fontWeight: "700", color: colors.ink }}>Today</Text>
              <Pressable onPress={() => router.push("/(tabs)/calendar")}>
                <Text style={{ color: colors.cyan, fontWeight: "700" }}>open calendar →</Text>
              </Pressable>
            </View>
            <Text style={{ fontSize: 13, color: colors.muted, marginBottom: space.sm }}>Tap a habit to log a complete day.</Text>
            {habits.length === 0 ? (
              <View style={{ alignItems: "center", paddingVertical: space.lg, gap: space.md }}>
                <Text style={{ fontSize: 13, color: colors.muted }}>No habits yet.</Text>
                <GradientButton title="Create your first habit" onPress={() => router.push("/(tabs)/habits")} />
              </View>
            ) : (
              <View style={{ gap: 8 }}>
                {habits.map((h) => {
                  const done = (h.logs?.[todayKey] || 0) >= h.goal;
                  return (
                    <Pressable key={h.id} onPress={() => toggleHabit(h.id)} style={[styles.habitRow, { borderColor: colors.line, backgroundColor: colors.surface2 }]}>
                      <View
                        style={[
                          styles.check,
                          { borderColor: h.color, backgroundColor: done ? h.color : "transparent" }
                        ]}
                      >
                        {done && <Icon name="check" size={14} color={colors.onGrad} />}
                      </View>
                      <View style={[styles.habitIcon, { backgroundColor: `${h.color}26` }]}>
                        <Icon name={h.icon} size={16} color={h.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: "500", color: colors.ink }}>{h.name}</Text>
                        <Text style={{ fontSize: 12, color: colors.muted }}>{h.goal} {h.unit} · {h.category}</Text>
                      </View>
                      <Text style={{ fontSize: 12, color: done ? colors.emerald : colors.muted }}>
                        {done ? "done" : "log"}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </Card>

          {/* Habit Matrix - Weekly/Monthly grid */}
          <HabitMatrix />

          {/* Donuts */}
          <View style={{ flexDirection: "row", gap: space.md }}>
            <Card style={{ flex: 1, alignItems: "center" }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.ink }}>Daily Progress</Text>
              <View style={{ marginVertical: space.md }}>
                <DonutChart
                  size={140}
                  progress={todayItemsTotal ? todayItemsDone / todayItemsTotal : 0}
                  color={colors.cyan}
                >
                  <Text style={{ fontSize: 22, fontWeight: "800", color: colors.ink }}>
                    {todayItemsTotal ? Math.round((todayItemsDone / todayItemsTotal) * 100) : 0}%
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.muted }}>{todayItemsDone}/{todayItemsTotal}</Text>
                </DonutChart>
              </View>
              <Text style={{ fontSize: 12, color: colors.muted }}>Habits {todayHabitsDone}/{habits.length} · Tasks {todayTasksDone}/{todayTasksTotal}</Text>
            </Card>
            <Card style={{ flex: 1, alignItems: "center" }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.ink }}>Monthly</Text>
              <View style={{ marginVertical: space.md }}>
                <DonutChart
                  size={140}
                  progress={sumGoals ? sumDone / sumGoals : 0}
                  color={colors.violet}
                >
                  <Text style={{ fontSize: 22, fontWeight: "800", color: colors.ink }}>{monthAvg}%</Text>
                  <Text style={{ fontSize: 12, color: colors.muted }}>{MONTHS[curMonth].slice(0, 3)}</Text>
                </DonutChart>
              </View>
              <Text style={{ fontSize: 12, color: colors.muted }}>{sumDone}/{sumGoals}</Text>
            </Card>
          </View>

          {/* Top habits */}
          <Card>
            <View style={styles.headRow}>
              <Text style={{ fontSize: 18, fontWeight: "700", color: colors.ink }}>Top Habits</Text>
              <Pressable onPress={() => router.push("/(tabs)/habits")}>
                <Text style={{ color: colors.cyan, fontWeight: "700" }}>manage →</Text>
              </Pressable>
            </View>
            <View style={{ gap: 10, marginTop: space.sm }}>
              {topHabits.length === 0 && <Text style={{ fontSize: 13, color: colors.muted }}>Add a habit to see rankings.</Text>}
              {topHabits.map((h, i) => (
                <View key={h.id} style={styles.topRow}>
                  <Text style={{ fontSize: 12, color: colors.muted, width: 22 }}>{String(i + 1).padStart(2, "0")}</Text>
                  <Icon name={h.icon} size={16} color={h.color} />
                  <Text style={{ fontSize: 14, fontWeight: "500", color: colors.ink, flex: 1 }} numberOfLines={1}>{h.name}</Text>
                  <View style={[styles.barTrack, { backgroundColor: colors.surface2 }]}>
                    <View style={[styles.barFill, { width: `${Math.min(100, h.pct)}%`, backgroundColor: h.color }]} />
                  </View>
                  <Text style={{ fontSize: 11, width: 50, textAlign: "right", color: colors.muted }}>{h.done}/{h.total}</Text>
                  <Text style={{ fontSize: 12, width: 36, textAlign: "right", color: colors.ink, fontWeight: "700" }}>{h.pct}%</Text>
                </View>
              ))}
            </View>
          </Card>

          {/* Shortcuts */}
          <View style={{ flexDirection: "row", gap: space.md, flexWrap: "wrap" }}>
            <Shortcut label="Tasks" icon="task" color={colors.amber} onPress={() => router.push("/tasks")} />
            <Shortcut label="AI Coach" icon="chat" color={colors.violet} onPress={() => router.push("/coach")} />
            <Shortcut label="Nutrition" icon="nutrition" color={colors.pink} onPress={() => router.push("/nutrition")} />
            <Shortcut label="Settings" icon="settings" color={colors.cyan} onPress={() => router.push("/settings")} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 12, color: colors.muted }}>{label}</Text>
      <Text style={{ fontSize: 18, fontWeight: "700", color: colors.ink, marginTop: 2 }}>{value}</Text>
    </View>
  );
}

function Shortcut({ label, icon, color, onPress }: { label: string; icon: string; color: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={[styles.shortcut, { backgroundColor: colors.surface, borderColor: colors.line }]}>
      <View style={[styles.shortcutIcon, { backgroundColor: `${color}26` }]}>
        <Icon name={icon} color={color} size={20} />
      </View>
      <Text style={{ fontSize: 14, fontWeight: "500", color: colors.ink }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  monthNav: { flexDirection: "row", gap: space.xs, marginTop: space.sm },
  metaRow: { flexDirection: "row", gap: space.md, marginTop: space.md },
  actionRow: { flexDirection: "row", gap: space.sm, marginTop: space.md },
  headRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  habitRow: {
    flexDirection: "row", alignItems: "center", gap: space.sm,
    paddingVertical: 10, paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth
  },
  check: {
    width: 26, height: 26, borderRadius: 13,
    borderWidth: 2, alignItems: "center", justifyContent: "center"
  },
  habitIcon: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  topRow: { flexDirection: "row", alignItems: "center", gap: space.sm },
  barTrack: { flex: 1, height: 6, borderRadius: 999, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 999 },
  shortcut: {
    flexBasis: "47%", flexGrow: 1,
    flexDirection: "row", alignItems: "center", gap: space.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14, padding: space.md
  },
  shortcutIcon: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" }
});
