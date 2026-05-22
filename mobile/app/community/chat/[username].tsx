import React, { useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import ScreenBackground from "../../../src/components/ScreenBackground";
import Header from "../../../src/components/Header";
import Icon from "../../../src/components/Icon";
import { useTheme } from "../../../src/ThemeContext";
import { space } from "../../../src/theme";
import { useAppStore } from "../../../src/store/useAppStore";

const EMOJI_BAR = ["❤️", "🔥", "👏", "🙌", "😊", "😂", "🚀"];

export default function ChatScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { username } = useLocalSearchParams<{ username: string }>();
  const uname = String(username || "");
  const { state, sendDM, isBlocked } = useAppStore();
  const [draft, setDraft] = useState("");

  const me = state.profile.username || state.profile.name || "you";
  const messages = state.dms[uname] || [];
  const blocked = isBlocked(uname);

  const submit = () => {
    if (!draft.trim() || blocked) return;
    sendDM(uname, draft.trim());
    setDraft("");
  };

  return (
    <ScreenBackground>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <Header title={`@${uname}`} back />
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 60}>
          <FlatList
            data={messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={{ padding: space.lg, gap: space.sm, paddingBottom: 20 }}
            ListEmptyComponent={
              <View style={{ alignItems: "center", padding: space.xxl }}>
                <Icon name="chat" size={32} color={colors.muted} />
                <Text style={{ color: colors.muted, marginTop: space.sm, fontSize: 13 }}>Start the conversation. No follow needed.</Text>
              </View>
            }
            renderItem={({ item }) => {
              const mine = item.from === me;
              return (
                <View style={{ alignItems: mine ? "flex-end" : "flex-start" }}>
                  <View style={[styles.bubble, mine ? { backgroundColor: colors.cyan } : { backgroundColor: colors.surface2, borderColor: colors.line, borderWidth: StyleSheet.hairlineWidth }]}>
                    <Text style={{ color: mine ? "#001018" : colors.ink, fontSize: 14 }}>{item.text}</Text>
                  </View>
                  <Text style={{ fontSize: 10, color: colors.muted, marginTop: 2 }}>{timeAgo(item.ts)}</Text>
                </View>
              );
            }}
          />

          {blocked ? (
            <View style={{ padding: space.md, alignItems: "center", borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line }}>
              <Text style={{ color: colors.muted, fontSize: 13 }}>You blocked {uname}. Unblock from their profile to send messages.</Text>
            </View>
          ) : (
            <View style={{ backgroundColor: colors.surfaceSolid, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line, paddingBottom: insets.bottom }}>
              <View style={{ flexDirection: "row", gap: 6, paddingHorizontal: space.md, paddingTop: space.sm }}>
                {EMOJI_BAR.map((e) => (
                  <Pressable key={e} onPress={() => setDraft((d) => d + e)} style={[styles.emoji, { backgroundColor: colors.surface2, borderColor: colors.line }]}>
                    <Text style={{ fontSize: 18 }}>{e}</Text>
                  </Pressable>
                ))}
              </View>
              <View style={styles.inputBar}>
                <TextInput
                  value={draft}
                  onChangeText={setDraft}
                  placeholder={`Message @${uname}…`}
                  placeholderTextColor={colors.muted}
                  style={[styles.input, { backgroundColor: colors.surface2, borderColor: colors.line, color: colors.ink }]}
                  onSubmitEditing={submit}
                  returnKeyType="send"
                  multiline
                />
                <Pressable onPress={submit} disabled={!draft.trim()} style={[styles.sendBtn, { backgroundColor: draft.trim() ? colors.cyan : colors.surface2 }]}>
                  <Icon name="send" size={16} color={draft.trim() ? "#001018" : colors.muted} />
                </Pressable>
              </View>
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

const styles = StyleSheet.create({
  bubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, maxWidth: "78%" },
  emoji: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", borderWidth: StyleSheet.hairlineWidth },
  inputBar: { flexDirection: "row", alignItems: "flex-end", gap: 8, paddingHorizontal: space.md, paddingTop: space.sm, paddingBottom: space.sm },
  input: { flex: 1, minHeight: 40, maxHeight: 120, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, fontSize: 14 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" }
});
