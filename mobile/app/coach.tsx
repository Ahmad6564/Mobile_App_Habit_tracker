import React, { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import ScreenBackground from "../src/components/ScreenBackground";
import Header from "../src/components/Header";
import GradientButton from "../src/components/GradientButton";
import Icon from "../src/components/Icon";
import { palette, space, typography } from "../src/theme";
import { useAppStore } from "../src/store/useAppStore";

const PROMPTS = [
  "How can I improve my water habit?",
  "What should I focus on this week?",
  "Tips for better sleep?",
  "How is my streak going?",
  "Give me a diet plan based on my habits"
];

export default function CoachScreen() {
  const { state, sendCoachMessage, newCoachChat, selectCoachChat, deleteCoachChat } = useAppStore();
  const [input, setInput] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  const active = state.coachChats.find((c) => c.id === state.coachActiveId);
  const messages = active?.messages || [];

  useEffect(() => { setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 30); }, [messages.length]);

  const send = (text?: string) => {
    const t = (text ?? input).trim(); if (!t) return;
    sendCoachMessage(t); setInput("");
  };

  return (
    <ScreenBackground>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <Header title={active?.title || "AI Coach"} back />
        <View style={styles.subBar}>
          <Pressable onPress={() => setShowHistory((s) => !s)} style={styles.subBtn}>
            <Icon name="chat" size={16} color={palette.ink} />
            <Text style={typography.small}>{showHistory ? "Hide" : "History"}</Text>
          </Pressable>
          <Pressable onPress={newCoachChat} style={styles.subBtn}>
            <Icon name="plus" size={16} color={palette.ink} />
            <Text style={typography.small}>New chat</Text>
          </Pressable>
        </View>

        {showHistory && (
          <ScrollView horizontal style={styles.historyStrip} contentContainerStyle={{ gap: 8, padding: space.md }}>
            {state.coachChats.length === 0 && <Text style={typography.muted}>No chats yet</Text>}
            {state.coachChats.map((c) => (
              <Pressable key={c.id} onPress={() => { selectCoachChat(c.id); setShowHistory(false); }} style={[styles.historyChip, c.id === state.coachActiveId && styles.historyChipActive]}>
                <Icon name="chat" size={12} color={palette.cyan} />
                <Text style={typography.small} numberOfLines={1}>{c.title}</Text>
                <Pressable onPress={() => deleteCoachChat(c.id)} hitSlop={8}>
                  <Icon name="trash" size={12} color={palette.muted} />
                </Pressable>
              </Pressable>
            ))}
          </ScrollView>
        )}

        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <ScrollView ref={scrollRef} contentContainerStyle={styles.stream}>
            {messages.length === 0 ? (
              <View style={{ alignItems: "center", padding: space.xl, gap: space.md }}>
                <Icon name="spark" size={36} color={palette.violet} />
                <Text style={typography.h1}>AI Coach</Text>
                <Text style={[typography.muted, { textAlign: "center" }]}>
                  Hi {state.profile.name || "there"} — I know your habits, streaks and tasks. Ask me anything.
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                  {PROMPTS.map((p) => (
                    <Pressable key={p} onPress={() => send(p)} style={styles.promptChip}>
                      <Text style={[typography.small, { color: palette.ink }]}>{p}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : (
              messages.map((m) => (
                <View key={m.id} style={[styles.bubble, m.role === "user" ? styles.userBubble : styles.coachBubble]}>
                  <View style={{ flexDirection: "row", gap: 6, alignItems: "center", marginBottom: 4 }}>
                    <Icon name={m.role === "user" ? "user" : "spark"} size={12} color={palette.muted} />
                    <Text style={typography.small}>{m.role === "user" ? "You" : "Coach"}</Text>
                  </View>
                  {m.text.split("\n\n").map((p, i) => (
                    <Text key={i} style={[typography.body, { marginBottom: 6 }]}>{p}</Text>
                  ))}
                </View>
              ))
            )}
          </ScrollView>

          <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, space.md) + space.md }]}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Ask your coach…"
              placeholderTextColor={palette.muted}
              style={styles.input}
              onSubmitEditing={() => send()}
              returnKeyType="send"
            />
            <GradientButton onPress={() => send()} title="" right={<Icon name="arrowRight" size={18} color={palette.onGrad} />} />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  subBar: { flexDirection: "row", gap: space.sm, padding: space.md, borderBottomColor: palette.line, borderBottomWidth: StyleSheet.hairlineWidth },
  subBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: palette.surface2, borderColor: palette.line, borderWidth: StyleSheet.hairlineWidth },
  historyStrip: { maxHeight: 60, borderBottomColor: palette.line, borderBottomWidth: StyleSheet.hairlineWidth },
  historyChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: palette.surface2, borderColor: palette.line, borderWidth: StyleSheet.hairlineWidth, maxWidth: 200 },
  historyChipActive: { borderColor: palette.cyan, backgroundColor: "rgba(34,211,238,0.15)" },
  stream: { padding: space.lg, gap: space.md, paddingBottom: space.xxl },
  bubble: { padding: space.md, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: palette.line, maxWidth: "92%" },
  userBubble: { alignSelf: "flex-end", backgroundColor: "rgba(34,211,238,0.10)", borderColor: "rgba(34,211,238,0.3)" },
  coachBubble: { alignSelf: "flex-start", backgroundColor: palette.surface },
  promptChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: palette.surface2, borderColor: palette.line, borderWidth: StyleSheet.hairlineWidth },
  composer: { flexDirection: "row", gap: space.sm, padding: space.md, borderTopColor: palette.line, borderTopWidth: StyleSheet.hairlineWidth, backgroundColor: "rgba(11,16,32,0.85)" },
  input: { flex: 1, backgroundColor: palette.surface2, borderColor: palette.line, borderWidth: StyleSheet.hairlineWidth, color: palette.ink, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999 }
});
