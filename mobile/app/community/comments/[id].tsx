import React, { useMemo, useState } from "react";
import { Alert, FlatList, Image, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import ScreenBackground from "../../../src/components/ScreenBackground";
import Icon from "../../../src/components/Icon";
import { useTheme } from "../../../src/ThemeContext";
import { space } from "../../../src/theme";
import { Comment, useAppStore } from "../../../src/store/useAppStore";

const EMOJI_BAR = ["❤️", "🔥", "👏", "🙌", "💪", "😊", "🎉", "🚀"];

export default function CommentsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, addComment, deleteComment, editComment, togglePostLike, togglePostSave, togglePostRepost } = useAppStore();
  const [draft, setDraft] = useState("");
  const [menuComment, setMenuComment] = useState<Comment | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const post = state.posts.find((p) => p.id === id);
  const me = state.profile.username || state.profile.name || "you";

  const ordered = useMemo<Comment[]>(() => {
    if (!post) return [];
    const mine = post.comments.filter((c) => c.user === me).sort((a, b) => b.ts - a.ts);
    const others = post.comments.filter((c) => c.user !== me).sort((a, b) => a.ts - b.ts);
    return [...mine, ...others];
  }, [post?.comments, me]);

  if (!post) {
    return (
      <ScreenBackground>
        <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", padding: space.md, gap: space.sm }}>
            <Pressable onPress={() => router.back()} hitSlop={8}><Icon name="back" size={22} color={colors.ink} /></Pressable>
            <Text style={{ fontSize: 16, fontWeight: "800", color: colors.ink }}>Comments</Text>
          </View>
          <View style={{ padding: space.lg }}><Text style={{ color: colors.muted }}>Post not found.</Text></View>
        </SafeAreaView>
      </ScreenBackground>
    );
  }

  const submit = () => {
    if (!draft.trim()) return;
    addComment(post.id, draft.trim());
    setDraft("");
  };

  const handleEdit = () => {
    if (!menuComment) return;
    setEditingId(menuComment.id);
    setEditText(menuComment.text);
    setMenuComment(null);
  };

  const handleDelete = () => {
    if (!menuComment) return;
    setMenuComment(null);
    Alert.alert("Delete comment?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteComment(post.id, menuComment.id) }
    ]);
  };

  const saveEdit = () => {
    if (editingId && editText.trim()) {
      editComment(post.id, editingId, editText.trim());
    }
    setEditingId(null);
    setEditText("");
  };

  return (
    <ScreenBackground>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={0}>
          {/* Top: post preview with right-side vertical actions (Instagram style) */}
          <View style={[styles.previewWrap, { borderBottomColor: colors.line, backgroundColor: "#000" }]}>
            {post.image ? (
              <Image source={{ uri: post.image }} style={styles.previewMedia} resizeMode="cover" />
            ) : (
              <View style={[styles.previewMedia, { backgroundColor: colors.surface2, alignItems: "center", justifyContent: "center" }]}>
                <Text style={{ fontSize: 48 }}>{post.avatar}</Text>
              </View>
            )}
            {/* Back button */}
            <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
              <Icon name="back" size={22} color="#fff" />
            </Pressable>
            {/* User overlay */}
            <Pressable onPress={() => router.push(`/community/${post.user}` as any)} style={styles.userOverlay}>
              <View style={styles.userAvatar}><Text style={{ fontSize: 14 }}>{post.avatar}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#fff", fontWeight: "800", fontSize: 13 }}>{post.user}</Text>
                <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }} numberOfLines={1}>{post.caption}</Text>
              </View>
            </Pressable>
            {/* Vertical actions on right (Instagram style) */}
            <View style={styles.rightActions}>
              <Pressable onPress={() => togglePostLike(post.id)} style={styles.rightBtn} hitSlop={6}>
                <Icon name={post.liked ? "heartFilled" : "heart"} size={26} color={post.liked ? "#ef4444" : "#fff"} />
                <Text style={styles.rightCount}>{post.likes}</Text>
              </Pressable>
              <View style={styles.rightBtn}>
                <Icon name="comment" size={24} color="#fff" />
                <Text style={styles.rightCount}>{post.comments.length}</Text>
              </View>
              <Pressable onPress={() => togglePostRepost(post.id)} style={styles.rightBtn} hitSlop={6}>
                <Icon name="repeat" size={24} color={post.reposted ? "#10b981" : "#fff"} />
                <Text style={styles.rightCount}>{post.reposts}</Text>
              </Pressable>
              <Pressable onPress={() => togglePostSave(post.id)} style={styles.rightBtn} hitSlop={6}>
                <Text style={{ fontSize: 22 }}>{post.saved ? "🔖" : "📑"}</Text>
              </Pressable>
            </View>
          </View>

          {/* Comments list */}
          <FlatList
            data={ordered}
            keyExtractor={(c) => c.id}
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: space.md, gap: space.md }}
            ListHeaderComponent={
              <View style={{ paddingBottom: space.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line, marginBottom: space.sm }}>
                <Text style={{ fontSize: 14, fontWeight: "800", color: colors.ink }}>{post.comments.length} Comments</Text>
              </View>
            }
            ListEmptyComponent={
              <View style={{ alignItems: "center", padding: space.xxl }}>
                <Icon name="comment" size={32} color={colors.muted} />
                <Text style={{ color: colors.muted, marginTop: space.sm, fontSize: 13 }}>Be the first to comment.</Text>
              </View>
            }
            renderItem={({ item }) => {
              const mine = item.user === me;
              const isEditing = editingId === item.id;
              return (
                <Pressable
                  onLongPress={() => { if (mine) setMenuComment(item); }}
                  style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}
                >
                  <View style={[styles.avatar, { backgroundColor: colors.surface2, borderColor: mine ? colors.cyan : colors.line }]}>
                    <Text style={{ fontSize: 14 }}>{(item.user || "U").charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={{ fontSize: 13, fontWeight: "800", color: mine ? colors.cyan : colors.ink }}>{mine ? "You" : item.user}</Text>
                      <Text style={{ fontSize: 10, color: colors.muted }}>{timeAgo(item.ts)}</Text>
                    </View>
                    {isEditing ? (
                      <View style={{ marginTop: 4 }}>
                        <TextInput
                          value={editText}
                          onChangeText={setEditText}
                          style={{ fontSize: 14, color: colors.ink, borderBottomWidth: 1, borderBottomColor: colors.cyan, paddingVertical: 4 }}
                          autoFocus
                          multiline
                        />
                        <View style={{ flexDirection: "row", gap: 12, marginTop: 6 }}>
                          <Pressable onPress={saveEdit}><Text style={{ fontSize: 12, fontWeight: "700", color: colors.cyan }}>Save</Text></Pressable>
                          <Pressable onPress={() => setEditingId(null)}><Text style={{ fontSize: 12, color: colors.muted }}>Cancel</Text></Pressable>
                        </View>
                      </View>
                    ) : (
                      <Text style={{ fontSize: 14, color: colors.ink, marginTop: 2 }}>{item.text}</Text>
                    )}
                  </View>
                </Pressable>
              );
            }}
          />

          {/* Bottom input area - background extends to system nav */}
          <View style={{ backgroundColor: colors.surfaceSolid, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line, paddingBottom: insets.bottom }}>
            {/* Emoji bar */}
            <View style={{ flexDirection: "row", gap: 6, paddingHorizontal: space.md, paddingTop: space.sm }}>
              {EMOJI_BAR.map((e) => (
                <Pressable key={e} onPress={() => setDraft((d) => d + e)} style={[styles.emoji, { backgroundColor: colors.surface2, borderColor: colors.line }]}>
                  <Text style={{ fontSize: 18 }}>{e}</Text>
                </Pressable>
              ))}
            </View>
            {/* Input row */}
            <View style={styles.inputBar}>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder={`Comment as ${me}…`}
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
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Context menu modal */}
      <Modal visible={!!menuComment} transparent animationType="fade" onRequestClose={() => setMenuComment(null)}>
        <Pressable style={styles.overlay} onPress={() => setMenuComment(null)}>
          <View style={[styles.menu, { backgroundColor: colors.surface1, borderColor: colors.line }]}>
            <Pressable onPress={handleEdit} style={styles.menuItem}>
              <Icon name="edit" size={16} color={colors.ink} />
              <Text style={{ fontSize: 15, color: colors.ink }}>Edit</Text>
            </Pressable>
            <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.line }} />
            <Pressable onPress={handleDelete} style={styles.menuItem}>
              <Icon name="trash" size={16} color="#f87171" />
              <Text style={{ fontSize: 15, color: "#f87171" }}>Delete</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
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
  previewWrap: { height: 240, position: "relative", borderBottomWidth: StyleSheet.hairlineWidth },
  previewMedia: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  backBtn: { position: "absolute", top: 8, left: 8, width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" },
  userOverlay: { position: "absolute", left: 12, right: 70, bottom: 10, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(0,0,0,0.45)", padding: 8, borderRadius: 10 },
  userAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  rightActions: { position: "absolute", right: 8, bottom: 8, gap: 12, alignItems: "center" },
  rightBtn: { alignItems: "center", gap: 2 },
  rightCount: { color: "#fff", fontSize: 10, fontWeight: "700" },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", borderWidth: 1.5 },
  emoji: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", borderWidth: StyleSheet.hairlineWidth },
  inputBar: { flexDirection: "row", alignItems: "flex-end", gap: 8, paddingHorizontal: space.md, paddingTop: space.sm, paddingBottom: space.sm },
  input: { flex: 1, minHeight: 40, maxHeight: 120, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, fontSize: 14 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  menu: { width: 200, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, overflow: "hidden" },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16 }
});
