import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../ThemeContext";
import { space, radii } from "../theme";
import type { NutritionResult } from "../lib/nutritionAI";

type Props = { result: NutritionResult };

export default function NutritionCard({ result }: Props) {
  const { colors } = useTheme();

  const macros = [
    { label: "Protein", value: result.protein, unit: "g", color: colors.cyan },
    { label: "Carbs", value: result.carbs, unit: "g", color: colors.violet },
    { label: "Fat", value: result.fat, unit: "g", color: colors.amber },
    { label: "Fiber", value: result.fiber, unit: "g", color: colors.emerald },
  ];

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.mealName, { color: colors.ink }]} numberOfLines={2}>
          {result.meal}
        </Text>
        <View style={[styles.badge, { backgroundColor: `${colors.emerald}20` }]}>
          <Text style={[styles.badgeText, { color: colors.emerald }]}>
            {Math.round(result.confidence * 100)}%
          </Text>
        </View>
      </View>

      {/* Calories */}
      <View style={styles.calorieRow}>
        <Text style={[styles.calorieNum, { color: colors.pink }]}>{result.calories}</Text>
        <Text style={[styles.calorieUnit, { color: colors.muted }]}>kcal</Text>
      </View>

      {/* Macro bars */}
      <View style={styles.macroGrid}>
        {macros.map((m) => (
          <View key={m.label} style={styles.macroItem}>
            <View style={styles.macroLabelRow}>
              <View style={[styles.macroDot, { backgroundColor: m.color }]} />
              <Text style={[styles.macroLabel, { color: colors.muted }]}>{m.label}</Text>
            </View>
            <Text style={[styles.macroValue, { color: colors.ink }]}>
              {m.value}{m.unit}
            </Text>
          </View>
        ))}
      </View>

      {/* Items */}
      {result.items.length > 0 && (
        <View style={[styles.section, { borderTopColor: colors.line }]}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>Detected Items</Text>
          {result.items.map((item, i) => (
            <View key={i} style={styles.itemRow}>
              <Text style={[styles.itemName, { color: colors.ink }]}>{item.name}</Text>
              <Text style={[styles.itemDetail, { color: colors.muted }]}>
                {item.calories} kcal · {item.portion}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Suggestions */}
      {result.suggestions.length > 0 && (
        <View style={[styles.section, { borderTopColor: colors.line }]}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>Suggestions</Text>
          {result.suggestions.map((s, i) => (
            <Text key={i} style={[styles.suggestion, { color: colors.ink }]}>
              • {s}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: space.lg,
    gap: space.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: space.sm,
  },
  mealName: {
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  calorieRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  calorieNum: {
    fontSize: 32,
    fontWeight: "800",
  },
  calorieUnit: {
    fontSize: 14,
    fontWeight: "600",
  },
  macroGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.md,
  },
  macroItem: {
    minWidth: 70,
    gap: 2,
  },
  macroLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  macroDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  macroLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  macroValue: {
    fontSize: 15,
    fontWeight: "700",
  },
  section: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: space.md,
    gap: space.xs,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 2,
  },
  itemName: {
    fontSize: 13,
    fontWeight: "600",
  },
  itemDetail: {
    fontSize: 12,
  },
  suggestion: {
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
  },
});
