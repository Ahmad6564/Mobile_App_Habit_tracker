import React, { useState } from "react";
import { FlatList, Image, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import ScreenBackground from "../../../src/components/ScreenBackground";
import Header from "../../../src/components/Header";
import Icon from "../../../src/components/Icon";
import { Video, ResizeMode } from "expo-av";
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
  const [selectedMedia, setSelectedMedia] = useState<{ uri: string; type: "image" | "video" } | null>(null);

  const me = state.profile.username || state.profile.name || "you";
  const messages = state.dms[uname] || [];
  const blocked = isBlocked(uname);

  const submit = () => {
    if ((!draft.trim() && !selectedMedia) || blocked) return;
    sendDM(uname, draft.trim(), selectedMedia?.uri, selectedMedia?.type);
    setDraft("");
    setSelectedMedia(null);
  };

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8
    });
    if (!res.canceled) setSelectedMedia({ uri: res.assets[0].uri, type: "image" });
  };

  const pickVideo = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      quality: 0.8
    });
    if (!res.canceled) setSelectedMedia({ uri: res.assets[0].uri, type: "video" });
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
                    {item.mediaUri ? (
                      item.mediaType === "video" ? (
                        <Video
                          source={{ uri: item.mediaUri }}
                          style={styles.dmVideo}
                          shouldPlay={false}
                          isMuted
                          useNativeControls
                          resizeMode={ResizeMode.COVER}
                        />
                      ) : (
                        <Image source={{ uri: item.mediaUri }} style={styles.dmImage} />
                      )
                    ) : null}
                    {item.text ? <Text style={{ color: mine ? "#001018" : colors.ink, fontSize: 14 }}>{item.text}</Text> : null}
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
              {selectedMedia ? (
                <View style={{ paddingHorizontal: space.md, paddingTop: space.sm }}>
                  <View style={[styles.previewWrap, { borderColor: colors.line, backgroundColor: colors.surface2 }]}>
                    {selectedMedia.type === "video" ? (
                      <Video source={{ uri: selectedMedia.uri }} style={styles.previewMedia} shouldPlay={false} isMuted resizeMode={ResizeMode.COVER} />
                    ) : (
                      <Image source={{ uri: selectedMedia.uri }} style={styles.previewMedia} />
                    )}
                    <Pressable onPress={() => setSelectedMedia(null)} style={styles.removeBtn}>
                      <Icon name="close" size={12} color="#fff" />
                    </Pressable>
                  </View>
                </View>
              ) : null}
              <View style={{ flexDirection: "row", gap: 6, paddingHorizontal: space.md, paddingTop: space.sm }}>
                {EMOJI_BAR.map((e) => (
                  <Pressable key={e} onPress={() => setDraft((d) => d + e)} style={[styles.emoji, { backgroundColor: colors.surface2, borderColor: colors.line }]}>
                    <Text style={{ fontSize: 18 }}>{e}</Text>
                  </Pressable>
                ))}
              </View>
              <View style={styles.inputBar}>
                <Pressable onPress={pickImage} style={[styles.mediaBtn, { backgroundColor: colors.surface2, borderColor: colors.line }]}>
                  <Icon name="gallery" size={16} color={colors.ink} />
                </Pressable>
                <Pressable onPress={pickVideo} style={[styles.mediaBtn, { backgroundColor: colors.surface2, borderColor: colors.line }]}>
                  <Icon name="video" size={16} color={colors.ink} />
                </Pressable>
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
  dmImage: { width: 180, height: 220, borderRadius: 10, marginBottom: 6, backgroundColor: "#000" },
  dmVideo: { width: 180, height: 220, borderRadius: 10, marginBottom: 6, backgroundColor: "#000" },
  previewWrap: {
    width: 100,
    height: 120,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    position: "relative"
  },
  previewMedia: { width: "100%", height: "100%", backgroundColor: "#000" },
  removeBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.6)"
  },
  emoji: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", borderWidth: StyleSheet.hairlineWidth },
  mediaBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth
  },
  inputBar: { flexDirection: "row", alignItems: "flex-end", gap: 8, paddingHorizontal: space.md, paddingTop: space.sm, paddingBottom: space.sm },
  input: { flex: 1, minHeight: 40, maxHeight: 120, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, fontSize: 14 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" }
});
