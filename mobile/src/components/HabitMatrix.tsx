import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { palette, space, typography } from "../theme";
import { useTheme } from "../ThemeContext";
import { useAppStore, today, Habit } from "../store/useAppStore";
import Card from "./Card";
import Icon from "./Icon";

type Mode = "week" | "month";
const SHORT_DAYS = ["S", "M", "T", "W", "T", "F", "S"];

function getDayAbbr(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dow = new Date(y, m - 1, d).getDay(); // 0=Sun
  return SHORT_DAYS[dow];
}

export default function HabitMatrix() {
  const { colors } = useTheme();
  const { state, toggleHabit } = useAppStore();
  const { habits } = state;
  const todayKey = today();
  const [mode, setMode] = useState<Mode>("week");

  // Always use current month for the monthly matrix
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // current week = Mon–Sun around today
  const now = new Date();
  const dayOfWeek = (now.getDay() + 6) % 7; // Mon=0
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - dayOfWeek);
  const weekStartKey = fmtKey(weekStart);

  const weekDays = useMemo(() => {
    const [y, m, d] = weekStartKey.split("-").map(Number);
    const start = new Date(y, m - 1, d);
    const days: string[] = [];
    for (let i = 0; i < 7; i++) {
      const dd = new Date(start);
      dd.setDate(start.getDate() + i);
      days.push(fmtKey(dd));
    }
    return days;
  }, [weekStartKey]);

  const monthDays = useMemo(() => {
    const days: string[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(`${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
    }
    return days;
  }, [currentYear, currentMonth, daysInMonth]);

  const days = mode === "week" ? weekDays : monthDays;

  // Compute row data
  const rows = useMemo(() => {
    return habits.map((h) => {
      let done = 0;
      const cells = days.map((d) => {
        const logged = h.logs?.[d] || 0;
        const complete = logged >= h.goal;
        if (complete) done++;
        return { date: d, complete, logged };
      });
      return { habit: h, cells, done };
    });
  }, [habits, days]);

  // Progress totals
  const totalDone = rows.reduce((s, r) => s + r.done, 0);
  const totalPossible = habits.length * days.length;
  const progressPct = totalPossible ? Math.round((totalDone / totalPossible) * 100) : 0;

  if (habits.length === 0) return null;

  return (
    <Card>
      <View style={styles.headRow}>
        <Text style={[typography.h2, { color: colors.ink }]}>
          {mode === "week" ? "Weekly Matrix" : "Monthly Matrix"}
        </Text>
        <Pressable onPress={() => setMode(mode === "week" ? "month" : "week")} style={[styles.toggleBtn, { borderColor: colors.line }]}>
          <Text style={[typography.small, { color: colors.cyan, fontWeight: "700" }]}>
            {mode === "week" ? "Show month" : "Show week"}
          </Text>
        </Pressable>
      </View>

      {/* Pinned left + Scrollable right layout */}
      <View style={{ flexDirection: "row", marginTop: space.sm }}>
        {/* Pinned left columns */}
        <View>
          {/* Header */}
          <View style={styles.leftRow}>
            <View style={styles.nameCell}>
              <Text style={[styles.colLabel, { color: colors.muted, textAlign: "left" }]}>Habit</Text>
            </View>
            <View style={styles.numCell}>
              <Text style={[styles.colLabel, { color: colors.muted }]}>Goal</Text>
            </View>
            <View style={styles.numCell}>
              <Text style={[styles.colLabel, { color: colors.muted }]}>Done</Text>
            </View>
          </View>
          {/* Habit rows */}
          {rows.map((row) => (
            <View key={row.habit.id} style={[styles.leftRow, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line }]}>
              <View style={styles.nameCell}>
                <View style={[styles.dot, { backgroundColor: row.habit.color }]} />
                <Text style={[typography.small, { color: colors.ink, flex: 1 }]} numberOfLines={1}>{row.habit.name}</Text>
              </View>
              <View style={styles.numCell}>
                <Text style={[styles.colVal, { color: colors.muted }]}>{row.habit.goal}</Text>
              </View>
              <View style={styles.numCell}>
                <Text style={[styles.colVal, { color: row.done > 0 ? colors.cyan : colors.muted, fontWeight: "700" }]}>{row.done}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Scrollable day columns */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
          <View>
            {/* Day headers */}
            <View style={styles.cellRow}>
              {days.map((d) => {
                const dayNum = parseInt(d.split("-")[2]);
                const dayAbbr = getDayAbbr(d);
                const isToday = d === todayKey;
                return (
                  <View key={d} style={styles.dayCol}>
                    <Text style={[styles.dayNum, { color: isToday ? colors.cyan : colors.muted }]}>{dayNum}</Text>
                    <Text style={[styles.dayAbbr, { color: isToday ? colors.cyan : colors.muted }]}>{dayAbbr}</Text>
                  </View>
                );
              })}
            </View>
            {/* Cell rows */}
            {rows.map((row) => (
              <View key={row.habit.id} style={[styles.cellRow, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line }]}>
                {row.cells.map((cell) => {
                  const isToday = cell.date === todayKey;
                  const isFuture = cell.date > todayKey;
                  return (
                    <Pressable
                      key={cell.date}
                      onPress={() => {
                        if (!isFuture) toggleHabit(row.habit.id, cell.date);
                      }}
                      style={[
                        styles.cell,
                        { borderColor: isToday ? colors.cyan : colors.line, opacity: isFuture ? 0.3 : 1 },
                        cell.complete && { backgroundColor: row.habit.color + "33", borderColor: row.habit.color }
                      ]}
                    >
                      {cell.complete && <Icon name="check" size={12} color={row.habit.color} />}
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Progress bar - outside the scroll */}
      <View style={[styles.progressRow, { borderTopWidth: 1, borderTopColor: colors.line }]}>
        <Text style={[typography.small, { color: colors.ink, fontWeight: "700" }]}>Progress</Text>
        <View style={[styles.progressTrack, { backgroundColor: colors.surface2 }]}>
          <View style={[styles.progressFill, { width: `${Math.min(100, progressPct)}%` }]} />
        </View>
        <Text style={[typography.small, { color: colors.muted }]}>{progressPct}%</Text>
        <Text style={[typography.small, { color: colors.muted }]}>{totalDone}/{totalPossible}</Text>
      </View>
    </Card>
  );
}

function fmtKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const styles = StyleSheet.create({
  headRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  toggleBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  leftRow: { flexDirection: "row", alignItems: "center", height: 44, paddingRight: 4 },
  nameCell: { width: 100, flexDirection: "row", alignItems: "center", gap: 6 },
  numCell: { width: 36, alignItems: "center", justifyContent: "center" },
  colLabel: { fontSize: 10, fontWeight: "700", textAlign: "center" },
  colVal: { fontSize: 12, fontWeight: "600", textAlign: "center" },
  dot: { width: 8, height: 8, borderRadius: 4 },
  cellRow: { flexDirection: "row", alignItems: "center", height: 44 },
  dayCol: { width: 34, alignItems: "center", justifyContent: "center" },
  dayNum: { fontSize: 11, fontWeight: "800" },
  dayAbbr: { fontSize: 9, fontWeight: "600", marginTop: 1 },
  cell: {
    width: 30, height: 30, borderRadius: 7, marginHorizontal: 2,
    borderWidth: 1.5, alignItems: "center", justifyContent: "center"
  },
  progressRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: space.sm, marginTop: space.xs },
  progressTrack: { flex: 1, height: 6, borderRadius: 999, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 999, backgroundColor: "#22d3ee" }
});
