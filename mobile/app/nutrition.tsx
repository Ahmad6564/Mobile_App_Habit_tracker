import React, { useEffect, useRef, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import ScreenBackground from "../src/components/ScreenBackground";
import Header from "../src/components/Header";
import GradientButton from "../src/components/GradientButton";
import Icon from "../src/components/Icon";
import { palette, space, typography } from "../src/theme";
import { useAppStore } from "../src/store/useAppStore";

const MEALS = ["Breakfast", "Lunch", "Dinner", "Snack"];

export default function NutritionScreen() {
  const { state, sendNutritionMessage, newNutritionChat, selectNutritionChat, deleteNutritionChat } = useAppStore();
  const [preview, setPreview] = useState<string | null>(null);
  const [meal, setMeal] = useState("Breakfast");
  const [showHistory, setShowHistory] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const insets = useSafeAreaInsets();
  const active = state.nutritionChats.find((c) => c.id === state.nutritionActiveId);
  const messages = active?.messages || [];

  useEffect(() => { setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 30); }, [messages.length]);

  const pick = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (!res.canceled) setPreview(res.assets[0].uri);
  };

  const analyze = () => {
    if (!preview) return;
    sendNutritionMessage(`Analyze my ${meal} meal`);
    setPreview(null);
  };

  return (
    <ScreenBackground>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <Header title={active?.title || "Nutrition AI"} back />

        <View style={styles.subBar}>
          <Pressable onPress={() => setShowHistory((s) => !s)} style={styles.subBtn}>
            <Icon name="nutrition" size={16} color={palette.ink} />
            <Text style={typography.small}>{showHistory ? "Hide" : "History"}</Text>
          </Pressable>
          <Pressable onPress={newNutritionChat} style={styles.subBtn}>
            <Icon name="plus" size={16} color={palette.ink} />
            <Text style={typography.small}>New chat</Text>
          </Pressable>
        </View>

        {showHistory && (
          <ScrollView horizontal style={styles.historyStrip} contentContainerStyle={{ gap: 8, padding: space.md }}>
            {state.nutritionChats.length === 0 && <Text style={typography.muted}>No history yet</Text>}
            {state.nutritionChats.map((c) => (
              <Pressable key={c.id} onPress={() => { selectNutritionChat(c.id); setShowHistory(false); }} style={[styles.historyChip, c.id === state.nutritionActiveId && styles.historyChipActive]}>
                <Icon name="nutrition" size={12} color={palette.pink} />
                <Text style={typography.small} numberOfLines={1}>{c.title}</Text>
                <Pressable onPress={() => deleteNutritionChat(c.id)} hitSlop={8}>
                  <Icon name="trash" size={12} color={palette.muted} />
                </Pressable>
              </Pressable>
            ))}
          </ScrollView>
        )}

        <ScrollView ref={scrollRef} contentContainerStyle={styles.stream}>
          {messages.length === 0 && !preview && (
            <View style={{ alignItems: "center", padding: space.xl, gap: space.md }}>
              <Icon name="nutrition" size={36} color={palette.pink} />
              <Text style={typography.h1}>Nutrition AI</Text>
              <Text style={[typography.muted, { textAlign: "center" }]}>
                Upload a meal photo to get estimated calories, protein, carbs and fat.
              </Text>
            </View>
          )}
          {messages.map((m) => (
            <View key={m.id} style={[styles.bubble, m.role === "user" ? styles.userBubble : styles.coachBubble]}>
              <View style={{ flexDirection: "row", gap: 6, alignItems: "center", marginBottom: 4 }}>
                <Icon name={m.role === "user" ? "user" : "nutrition"} size={12} color={palette.muted} />
                <Text style={typography.small}>{m.role === "user" ? "You" : "Nutrition AI"}</Text>
              </View>
              {m.text.split("\n\n").map((p, i) => <Text key={i} style={[typography.body, { marginBottom: 6 }]}>{p}</Text>)}
            </View>
          ))}
        </ScrollView>

        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, space.md) + space.md }]}>
          {preview && (
            <View style={styles.preview}>
              <Image source={{ uri: preview }} style={styles.previewImg} />
              <Pressable onPress={() => setPreview(null)} style={styles.previewClose}>
                <Icon name="close" size={14} color={palette.ink} />
              </Pressable>
            </View>
          )}
          <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
            {MEALS.map((m) => (
              <Pressable key={m} onPress={() => setMeal(m)} style={[styles.mealChip, meal === m && styles.mealChipActive]}>
                <Text style={[typography.small, { color: meal === m ? palette.ink : palette.muted, fontWeight: "700" }]}>{m}</Text>
              </Pressable>
            ))}
          </View>
          <View style={{ flexDirection: "row", gap: space.sm }}>
            <GradientButton title="Photo" left={<Icon name="plus" size={14} color={palette.ink} />} variant="ghost" onPress={pick} />
            <GradientButton title="Analyze" left={<Icon name="spark" size={14} color={palette.onGrad} />} onPress={analyze} />
          </View>
        </View>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  subBar: { flexDirection: "row", gap: space.sm, padding: space.md, borderBottomColor: palette.line, borderBottomWidth: StyleSheet.hairlineWidth },
  subBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: palette.surface2, borderColor: palette.line, borderWidth: StyleSheet.hairlineWidth },
  historyStrip: { maxHeight: 60, borderBottomColor: palette.line, borderBottomWidth: StyleSheet.hairlineWidth },
  historyChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: palette.surface2, borderColor: palette.line, borderWidth: StyleSheet.hairlineWidth, maxWidth: 200 },
  historyChipActive: { borderColor: palette.pink, backgroundColor: "rgba(244,114,182,0.15)" },
  stream: { padding: space.lg, gap: space.md, paddingBottom: space.xl },
  bubble: { padding: space.md, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: palette.line, maxWidth: "92%" },
  userBubble: { alignSelf: "flex-end", backgroundColor: "rgba(244,114,182,0.10)", borderColor: "rgba(244,114,182,0.3)" },
  coachBubble: { alignSelf: "flex-start", backgroundColor: palette.surface },
  bottomBar: { padding: space.md, gap: space.sm, borderTopColor: palette.line, borderTopWidth: StyleSheet.hairlineWidth, backgroundColor: "rgba(11,16,32,0.9)" },
  preview: { alignSelf: "flex-start", borderRadius: 12, overflow: "hidden", position: "relative" },
  previewImg: { width: 80, height: 80, borderRadius: 12 },
  previewClose: { position: "absolute", top: 4, right: 4, backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 999, padding: 4 },
  mealChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: palette.surface2, borderColor: palette.line, borderWidth: StyleSheet.hairlineWidth },
  mealChipActive: { borderColor: palette.pink, backgroundColor: "rgba(244,114,182,0.15)" }
});
