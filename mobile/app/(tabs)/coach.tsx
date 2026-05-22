import React, { useEffect, useRef, useState } from "react";
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import ScreenBackground from "../../src/components/ScreenBackground";
import Header from "../../src/components/Header";
import GradientButton from "../../src/components/GradientButton";
import Icon from "../../src/components/Icon";
import { space } from "../../src/theme";
import { useTheme } from "../../src/ThemeContext";
import { useAppStore } from "../../src/store/useAppStore";

const PROMPTS = [
  "How can I improve my water habit?",
  "What should I focus on this week?",
  "Tips for better sleep?",
  "How is my streak going?",
  "Give me a diet plan based on my habits"
];

export default function CoachTab() {
  const { colors } = useTheme();
  const { state, sendCoachMessage, newCoachChat, selectCoachChat, deleteCoachChat } = useAppStore();
  const [input, setInput] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const active = state.coachChats.find((c) => c.id === state.coachActiveId);
  const messages = active?.messages || [];

  useEffect(() => { setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 30); }, [messages.length]);

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  const send = (text?: string) => {
    const t = (text ?? input).trim(); if (!t) return;
    sendCoachMessage(t); setInput("");
  };

  return (
    <ScreenBackground>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <Header title="AI Coach" />

        <View style={[styles.subBar, { borderBottomColor: colors.line }]}>
          <Pressable onPress={() => setShowHistory((s) => !s)} style={[styles.subBtn, { backgroundColor: colors.surface2, borderColor: colors.line }]}>
            <Icon name="chat" size={16} color={colors.ink} />
            <Text style={{ fontSize: 12, color: colors.muted }}>{showHistory ? "Hide" : "History"}</Text>
          </Pressable>
          <Pressable onPress={newCoachChat} style={[styles.subBtn, { backgroundColor: colors.surface2, borderColor: colors.line }]}>
            <Icon name="plus" size={16} color={colors.ink} />
            <Text style={{ fontSize: 12, color: colors.muted }}>New chat</Text>
          </Pressable>
        </View>

        {showHistory && (
          <ScrollView horizontal style={[styles.historyStrip, { borderBottomColor: colors.line }]} contentContainerStyle={{ gap: 8, padding: space.md }}>
            {state.coachChats.length === 0 && <Text style={{ fontSize: 13, color: colors.muted }}>No history yet</Text>}
            {state.coachChats.map((c) => (
              <Pressable key={c.id} onPress={() => { selectCoachChat(c.id); setShowHistory(false); }} style={[styles.historyChip, { backgroundColor: colors.surface2, borderColor: c.id === state.coachActiveId ? colors.cyan : colors.line }]}>
                <Icon name="chat" size={12} color={colors.cyan} />
                <Text style={{ fontSize: 12, color: colors.muted }} numberOfLines={1}>{c.title}</Text>
                <Pressable onPress={() => deleteCoachChat(c.id)} hitSlop={8}>
                  <Icon name="trash" size={12} color={colors.muted} />
                </Pressable>
              </Pressable>
            ))}
          </ScrollView>
        )}

        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }} keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}>
          <ScrollView ref={scrollRef} contentContainerStyle={styles.stream}>
            {messages.length === 0 && (
              <View style={{ alignItems: "center", padding: space.xl, gap: space.md }}>
                <Icon name="chat" size={36} color={colors.violet} />
                <Text style={{ fontSize: 22, fontWeight: "800", color: colors.ink }}>AI Coach</Text>
                <Text style={{ fontSize: 13, color: colors.muted, textAlign: "center" }}>Your personal habit coach. Ask for tips, plans, and feedback.</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: space.sm }}>
                  {PROMPTS.map((p) => (
                    <Pressable key={p} onPress={() => send(p)} style={[styles.promptChip, { backgroundColor: colors.surface2, borderColor: colors.line }]}>
                      <Text style={{ fontSize: 12, color: colors.ink }}>{p}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
            {messages.map((m) => (
              <View key={m.id} style={[styles.bubble, m.role === "user" ? styles.userBubble : [styles.coachBubble, { backgroundColor: colors.surface, borderColor: colors.line }]]}>
                <View style={{ flexDirection: "row", gap: 6, alignItems: "center", marginBottom: 4 }}>
                  <Icon name={m.role === "user" ? "user" : "chat"} size={12} color={colors.muted} />
                  <Text style={{ fontSize: 12, color: colors.muted }}>{m.role === "user" ? "You" : "AI Coach"}</Text>
                </View>
                {m.text.split("\n\n").map((p, i) => <Text key={i} style={{ fontSize: 14, fontWeight: "500", color: colors.ink, marginBottom: 6 }}>{p}</Text>)}
              </View>
            ))}
          </ScrollView>

          <View style={[styles.composer, { borderTopColor: colors.line, backgroundColor: colors.surfaceSolid, paddingBottom: keyboardVisible ? space.sm : space.md, marginBottom: keyboardVisible ? 0 : 56 + Math.max(insets.bottom, 12) }]}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Ask your coach…"
              placeholderTextColor={colors.muted}
              style={[styles.input, { backgroundColor: colors.surface2, borderColor: colors.line, color: colors.ink }]}
              onSubmitEditing={() => send()}
              returnKeyType="send"
            />
            <GradientButton onPress={() => send()} title="" right={<Icon name="arrowRight" size={18} color={colors.onGrad} />} />
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
  stream: { padding: space.lg, gap: space.md, paddingBottom: space.xxl },
  bubble: { padding: space.md, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, maxWidth: "92%" },
  userBubble: { alignSelf: "flex-end", backgroundColor: "rgba(34,211,238,0.10)", borderColor: "rgba(34,211,238,0.3)" },
  coachBubble: { alignSelf: "flex-start" },
  promptChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth },
  composer: { flexDirection: "row", gap: space.sm, padding: space.md, borderTopWidth: StyleSheet.hairlineWidth },
  input: { flex: 1, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999 }
});
