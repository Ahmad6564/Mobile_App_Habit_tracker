import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Image, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import ScreenBackground from "../../src/components/ScreenBackground";
import Header from "../../src/components/Header";
import GradientButton from "../../src/components/GradientButton";
import NutritionCard from "../../src/components/NutritionCard";
import Icon from "../../src/components/Icon";
import { space } from "../../src/theme";
import { useTheme } from "../../src/ThemeContext";
import { useAppStore, today } from "../../src/store/useAppStore";

const MEALS = ["Breakfast", "Lunch", "Dinner", "Snack"];

export default function NutritionTab() {
  const { colors } = useTheme();
  const { state, sendNutritionMessage, newNutritionChat, selectNutritionChat, deleteNutritionChat } = useAppStore();
  const [preview, setPreview] = useState<string | null>(null);
  const [meal, setMeal] = useState("Breakfast");
  const [showHistory, setShowHistory] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const s = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true));
    const h = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false));
    return () => { s.remove(); h.remove(); };
  }, []);

  const active = state.nutritionChats.find((c) => c.id === state.nutritionActiveId);
  const messages = active?.messages || [];

  useEffect(() => { setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 30); }, [messages.length]);

  const pick = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.7 });
    if (!res.canceled) setPreview(res.assets[0].uri);
  };

  const capture = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!res.canceled) setPreview(res.assets[0].uri);
  };

  const analyze = () => {
    if (!preview) return;
    sendNutritionMessage(`Analyze my ${meal} meal`, preview);
    setPreview(null);
  };

  // Daily totals
  const todayLog = state.nutritionLog?.[today()] || [];
  const dailyCals = todayLog.reduce((s, r) => s + r.calories, 0);
  const calorieTarget = state.settings.calorieTarget || 2200;

  return (
    <ScreenBackground>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <Header title={active?.title || "Nutrition AI"} />

        <View style={[styles.subBar, { borderBottomColor: colors.line }]}>
          <Pressable onPress={() => setShowHistory((s) => !s)} style={[styles.subBtn, { backgroundColor: colors.surface2, borderColor: colors.line }]}>
            <Icon name="nutrition" size={16} color={colors.ink} />
            <Text style={{ fontSize: 12, color: colors.muted }}>{showHistory ? "Hide" : "History"}</Text>
          </Pressable>
          <Pressable onPress={newNutritionChat} style={[styles.subBtn, { backgroundColor: colors.surface2, borderColor: colors.line }]}>
            <Icon name="plus" size={16} color={colors.ink} />
            <Text style={{ fontSize: 12, color: colors.muted }}>New chat</Text>
          </Pressable>
        </View>

        {showHistory && (
          <ScrollView horizontal style={[styles.historyStrip, { borderBottomColor: colors.line }]} contentContainerStyle={{ gap: 8, padding: space.md }}>
            {state.nutritionChats.length === 0 && <Text style={{ fontSize: 13, color: colors.muted }}>No history yet</Text>}
            {state.nutritionChats.map((c) => (
              <Pressable key={c.id} onPress={() => { selectNutritionChat(c.id); setShowHistory(false); }} style={[styles.historyChip, { backgroundColor: colors.surface2, borderColor: c.id === state.nutritionActiveId ? colors.pink : colors.line }]}>
                <Icon name="nutrition" size={12} color={colors.pink} />
                <Text style={{ fontSize: 12, color: colors.muted }} numberOfLines={1}>{c.title}</Text>
                <Pressable onPress={() => deleteNutritionChat(c.id)} hitSlop={8}>
                  <Icon name="trash" size={12} color={colors.muted} />
                </Pressable>
              </Pressable>
            ))}
          </ScrollView>
        )}

        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }} keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}>
        <ScrollView ref={scrollRef} contentContainerStyle={styles.stream}>
          {/* Daily Summary Banner */}
          {todayLog.length > 0 && (
            <View style={[styles.dailyBanner, { backgroundColor: colors.surface2, borderColor: colors.line }]}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: colors.ink }}>
                Today: {dailyCals} / {calorieTarget} kcal
              </Text>
              <View style={[styles.progressTrack, { backgroundColor: colors.line }]}>
                <View style={[styles.progressFill, { width: `${Math.min((dailyCals / calorieTarget) * 100, 100)}%`, backgroundColor: dailyCals > calorieTarget ? colors.danger : colors.emerald }]} />
              </View>
              <Text style={{ fontSize: 11, color: colors.muted }}>
                P: {todayLog.reduce((s, r) => s + r.protein, 0)}g · C: {todayLog.reduce((s, r) => s + r.carbs, 0)}g · F: {todayLog.reduce((s, r) => s + r.fat, 0)}g
              </Text>
            </View>
          )}

          {messages.length === 0 && !preview && (
            <View style={{ alignItems: "center", padding: space.xl, gap: space.md }}>
              <Icon name="nutrition" size={36} color={colors.pink} />
              <Text style={{ fontSize: 22, fontWeight: "800", color: colors.ink }}>Nutrition AI</Text>
              <Text style={{ fontSize: 13, color: colors.muted, textAlign: "center" }}>
                Upload or capture a meal photo to get estimated calories, protein, carbs and fat.
              </Text>
            </View>
          )}
          {messages.map((m) => (
            <View key={m.id} style={[styles.bubble, m.role === "user" ? styles.userBubble : [styles.coachBubble, { backgroundColor: colors.surface, borderColor: colors.line }]]}>
              <View style={{ flexDirection: "row", gap: 6, alignItems: "center", marginBottom: 4 }}>
                <Icon name={m.role === "user" ? "user" : "nutrition"} size={12} color={colors.muted} />
                <Text style={{ fontSize: 12, color: colors.muted }}>{m.role === "user" ? "You" : "Nutrition AI"}</Text>
              </View>
              {/* User image thumbnail */}
              {m.role === "user" && m.imageUri && (
                <Image source={{ uri: m.imageUri }} style={styles.chatImage} />
              )}
              {/* Loading indicator */}
              {m.loading && (
                <View style={{ flexDirection: "row", gap: 8, alignItems: "center", paddingVertical: space.sm }}>
                  <ActivityIndicator size="small" color={colors.pink} />
                  <Text style={{ fontSize: 14, fontWeight: "500", color: colors.muted }}>Analyzing your meal...</Text>
                </View>
              )}
              {/* Nutrition card for results */}
              {!m.loading && m.nutrition && <NutritionCard result={m.nutrition} />}
              {/* Text fallback (errors, plain messages) */}
              {!m.loading && !m.nutrition && m.text.split("\n\n").map((p, i) => (
                <Text key={i} style={{ fontSize: 14, fontWeight: "500", color: colors.ink, marginBottom: 6 }}>{p}</Text>
              ))}
            </View>
          ))}
        </ScrollView>

        <View style={[styles.bottomBar, { borderTopColor: colors.line, backgroundColor: colors.surfaceSolid, paddingBottom: keyboardVisible ? space.sm : space.md, marginBottom: keyboardVisible ? 0 : 56 + Math.max(insets.bottom, 12) }]}>
          {preview && (
            <View style={styles.preview}>
              <Image source={{ uri: preview }} style={styles.previewImg} />
              <Pressable onPress={() => setPreview(null)} style={styles.previewClose}>
                <Icon name="close" size={14} color="#fff" />
              </Pressable>
            </View>
          )}
          <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
            {MEALS.map((m) => (
              <Pressable key={m} onPress={() => setMeal(m)} style={[styles.mealChip, { backgroundColor: colors.surface2, borderColor: meal === m ? colors.pink : colors.line }, meal === m && { backgroundColor: "rgba(244,114,182,0.15)" }]}>
                <Text style={{ fontSize: 12, color: meal === m ? colors.ink : colors.muted, fontWeight: "700" }}>{m}</Text>
              </Pressable>
            ))}
          </View>
          <View style={{ flexDirection: "row", gap: space.sm }}>
            <GradientButton title="Camera" left={<Icon name="plus" size={14} color={colors.ink} />} variant="ghost" onPress={capture} />
            <GradientButton title="Photo" left={<Icon name="plus" size={14} color={colors.ink} />} variant="ghost" onPress={pick} />
            <GradientButton title="Analyze" left={<Icon name="spark" size={14} color={colors.onGrad} />} onPress={analyze} />
          </View>
        </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  subBar: { flexDirection: "row", gap: space.sm, padding: space.md, borderBottomWidth: StyleSheet.hairlineWidth },
  subBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth },
  historyStrip: { maxHeight: 60, borderBottomWidth: StyleSheet.hairlineWidth },
  historyChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, maxWidth: 200 },
  stream: { padding: space.lg, gap: space.md, paddingBottom: space.xl },
  bubble: { padding: space.md, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, maxWidth: "92%" },
  userBubble: { alignSelf: "flex-end", backgroundColor: "rgba(244,114,182,0.10)", borderColor: "rgba(244,114,182,0.3)" },
  coachBubble: { alignSelf: "flex-start" },
  bottomBar: { padding: space.md, gap: space.sm, borderTopWidth: StyleSheet.hairlineWidth },
  preview: { alignSelf: "flex-start", borderRadius: 12, overflow: "hidden", position: "relative" },
  previewImg: { width: 80, height: 80, borderRadius: 12 },
  previewClose: { position: "absolute", top: 4, right: 4, backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 999, padding: 4 },
  mealChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth },
  dailyBanner: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, padding: space.md, gap: space.xs },
  progressTrack: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: 6, borderRadius: 3 },
  chatImage: { width: 120, height: 120, borderRadius: 10, marginBottom: space.xs },
});
