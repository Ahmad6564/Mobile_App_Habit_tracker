import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ScreenBackground from "../../src/components/ScreenBackground";
import Header from "../../src/components/Header";
import Card from "../../src/components/Card";
import GradientButton from "../../src/components/GradientButton";
import { useTheme } from "../../src/ThemeContext";
import { space } from "../../src/theme";
import { today, useAppStore } from "../../src/store/useAppStore";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DOW = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

export default function CalendarScreen() {
  const { colors, isDark } = useTheme();
  const { state, goPrevMonth, goNextMonth, goThisMonth } = useAppStore();
  const { viewYear, viewMonth, habits, tasks } = state;
  const todayKey = today();
  const now = new Date();
  const isCurrent = now.getFullYear() === viewYear && now.getMonth() === viewMonth;

  const grid = (() => {
    // getDay() returns 0=Sun, 1=Mon,...6=Sat — we start week on Sunday
    const firstDow = new Date(viewYear, viewMonth, 1).getDay(); // 0-6, Sunday=0
    const lead = firstDow; // blanks before day 1
    const last = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: (null | { key: string; day: number; pct: number; taskCount: number; isToday: boolean })[] = [];
    for (let i = 0; i < lead; i += 1) cells.push(null);
    for (let d = 1; d <= last; d += 1) {
      const key = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      let habitsDone = 0;
      habits.forEach((h) => {
        if ((h.logs?.[key] || 0) >= h.goal) habitsDone += 1;
      });
      const pct = habits.length ? Math.round((habitsDone / habits.length) * 100) : 0;
      const taskCount = tasks.filter((t) => t.due === key).length;
      cells.push({ key, day: d, pct, taskCount, isToday: key === todayKey });
    }
    // pad end to complete last row
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  })();

  const perfectDays = grid.filter((c) => c && c.pct >= 100).length;
  const goodDays = grid.filter((c) => c && c.pct >= 70 && c.pct < 100).length;

  return (
    <ScreenBackground>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <Header title="Calendar" />
        <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md, paddingBottom: 140 }}>
          <Card>
            <Text style={{ fontSize: 11, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase", color: colors.muted }}>Calendar</Text>
            <Text style={{ fontSize: 28, fontWeight: "900", color: colors.ink, marginTop: 4 }}>
              {MONTHS[viewMonth]} <Text style={{ color: colors.muted }}>{viewYear}</Text>
            </Text>
            <View style={{ flexDirection: "row", gap: 6, marginTop: space.sm }}>
              <GradientButton title="◀ Prev" variant="ghost" size="sm" onPress={goPrevMonth} />
              {!isCurrent && <GradientButton title="This Month" variant="ghost" size="sm" onPress={goThisMonth} />}
              <GradientButton title="Next ▶" variant="ghost" size="sm" onPress={goNextMonth} />
            </View>
            <View style={{ flexDirection: "row", gap: space.lg, marginTop: space.md }}>
              <Stat label="Perfect days" value={perfectDays} color={LEVEL_COLOR[4]} colors={colors} />
              <Stat label="Good days" value={goodDays} color={LEVEL_COLOR[3]} colors={colors} />
            </View>
          </Card>

          <Card padded={false}>
            {/* Day headers */}
            <View style={styles.weekRow}>
              {DOW.map((d, i) => (
                <View key={i} style={styles.dayCol}>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: i === 0 ? colors.pink : colors.muted, textAlign: "center" }}>{d}</Text>
                </View>
              ))}
            </View>
            {/* Calendar grid */}
            <View style={styles.gridWrap}>
              {grid.map((cell, i) => {
                if (!cell) return <View key={i} style={styles.dayCol} />;
                const level = cell.pct >= 100 ? 4 : cell.pct >= 70 ? 3 : cell.pct >= 50 ? 2 : cell.pct > 0 ? 1 : 0;
                const bg = isDark ? LEVEL_BG_DARK[level] : LEVEL_BG_LIGHT[level];
                const textColor = level >= 3 ? "#fff" : colors.ink;
                return (
                  <View key={i} style={styles.dayCol}>
                    <View style={[styles.cellInner, { backgroundColor: bg, borderColor: cell.isToday ? colors.cyan : "transparent" }]}>
                      <Text style={{ fontSize: 13, fontWeight: "700", color: cell.isToday ? colors.cyan : textColor }}>{cell.day}</Text>
                      {cell.pct > 0 && <Text style={{ fontSize: 9, fontWeight: "600", color: level >= 3 ? "rgba(255,255,255,0.85)" : colors.muted }}>{cell.pct}%</Text>}
                      {cell.taskCount > 0 && <View style={[styles.taskDot, { backgroundColor: colors.amber }]} />}
                    </View>
                  </View>
                );
              })}
            </View>
            {/* Legend */}
            <View style={styles.legend}>
              <Text style={{ fontSize: 10, color: colors.muted }}>0%</Text>
              {(isDark ? LEVEL_BG_DARK : LEVEL_BG_LIGHT).map((bg, i) => (
                <View key={i} style={[styles.legendBox, { backgroundColor: bg }]} />
              ))}
              <Text style={{ fontSize: 10, color: colors.muted }}>100%</Text>
            </View>
          </Card>
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

// Color levels: 0=nothing, 1=<50%, 2=50-69%, 3=70-99%, 4=100%
const LEVEL_COLOR = ["transparent", "#fbbf24", "#fb923c", "#a78bfa", "#34d399"];

const LEVEL_BG_DARK = [
  "rgba(255,255,255,0.03)",  // 0: nothing
  "rgba(251,191,36,0.20)",   // 1: some (<50%) - amber tint
  "rgba(251,146,60,0.35)",   // 2: half (50-69%) - orange
  "rgba(167,139,250,0.50)",  // 3: good (70-99%) - violet
  "rgba(52,211,153,0.60)"    // 4: perfect (100%) - emerald
];

const LEVEL_BG_LIGHT = [
  "rgba(0,0,0,0.02)",        // 0: nothing
  "rgba(251,191,36,0.15)",   // 1: some
  "rgba(251,146,60,0.25)",   // 2: half
  "rgba(167,139,250,0.35)",  // 3: good
  "rgba(16,185,129,0.45)"    // 4: perfect
];

function Stat({ label, value, color, colors }: { label: string; value: number; color: string; colors: any }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
      <View>
        <Text style={{ fontSize: 11, color: colors.muted }}>{label}</Text>
        <Text style={{ fontSize: 20, fontWeight: "800", color: colors.ink }}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  weekRow: { flexDirection: "row", paddingHorizontal: 4, paddingTop: 10, paddingBottom: 6 },
  gridWrap: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 4, paddingBottom: 8 },
  dayCol: { width: `${100 / 7}%`, alignItems: "center", justifyContent: "center", paddingVertical: 3 },
  cellInner: { width: "86%", aspectRatio: 1, borderRadius: 8, borderWidth: 1.5, alignItems: "center", justifyContent: "center", gap: 1, padding: 2 },
  taskDot: { width: 5, height: 5, borderRadius: 3, marginTop: 1 },
  legend: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 10 },
  legendBox: { width: 16, height: 16, borderRadius: 4 }
});
