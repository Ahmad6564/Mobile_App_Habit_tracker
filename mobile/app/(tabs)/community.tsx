import React, { useMemo, useState } from "react";
import { Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import ScreenBackground from "../../src/components/ScreenBackground";
import Card from "../../src/components/Card";
import GradientButton from "../../src/components/GradientButton";
import Icon from "../../src/components/Icon";
import { useTheme } from "../../src/ThemeContext";
import { space } from "../../src/theme";
import { Post, useAppStore } from "../../src/store/useAppStore";

export default function CommunityScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const {
    state,
    togglePostLike,
    togglePostRepost,
    togglePostSave,
    editPost,
    deletePost,
    unreadNotifCount
  } = useAppStore();
  const [filter, setFilter] = useState<"all" | "posts" | "reels">("all");
  const [search, setSearch] = useState("");
  const [editingPost, setEditingPost] = useState<{ id: string; caption: string } | null>(null);

  const me = state.profile.username || state.profile.name || "you";
  const myPosts = state.posts.filter((p) => p.user === me);

  const feed = useMemo(() => {
    return state.posts
      .filter((p) => !state.blocked.includes(p.user))
      .filter((p) => filter === "all" ? true : filter === "reels" ? p.kind === "reel" : p.kind === "post")
      .filter((p) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return p.caption.toLowerCase().includes(q) || p.user.toLowerCase().includes(q) || p.tags.some((t) => t.toLowerCase().includes(q));
      });
  }, [state.posts, state.blocked, filter, search]);

  const unread = unreadNotifCount();
  const suggested = state.users.filter((u) => u.username !== me && u.username !== state.profile.name && !state.following.includes(u.username) && !state.blocked.includes(u.username)).slice(0, 6);

  return (
    <ScreenBackground>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        {/* Top bar */}
        <View style={[styles.topBar, { borderBottomColor: colors.line }]}>
          <Text style={{ fontSize: 22, fontWeight: "900", color: colors.ink, letterSpacing: 0.3 }}>Community</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable onPress={() => router.push("/community/notifications" as any)} style={[styles.iconBtn, { backgroundColor: colors.surface2, borderColor: colors.line }]}>
              <Icon name="bell" size={18} color={colors.ink} />
              {unread > 0 && <View style={[styles.dot, { backgroundColor: colors.pink }]}><Text style={styles.dotText}>{unread > 9 ? "9+" : unread}</Text></View>}
            </Pressable>
            <Pressable onPress={() => router.push("/community/messages" as any)} style={[styles.iconBtn, { backgroundColor: colors.surface2, borderColor: colors.line }]}>
              <Icon name="paperPlane" size={18} color={colors.ink} />
            </Pressable>
            <Pressable onPress={() => router.push("/community-settings" as any)} style={[styles.iconBtn, { backgroundColor: colors.surface2, borderColor: colors.line }]}>
              <Icon name="settings" size={18} color={colors.ink} />
            </Pressable>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
          {/* My profile strip */}
          <View style={[styles.profileCard, { borderBottomColor: colors.line }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
              <View style={[styles.avatarCircle, { borderColor: colors.cyan, backgroundColor: colors.surface2 }]}>
                <Text style={{ fontSize: 22 }}>{(state.profile.name || "U").charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.ink }}>{state.profile.name || "You"}</Text>
                <Text style={{ fontSize: 12, color: colors.muted }}>@{me}</Text>
                {state.profile.bio ? <Text numberOfLines={1} style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>{state.profile.bio}</Text> : null}
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={{ fontSize: 18, fontWeight: "800", color: colors.ink }}>{myPosts.length}</Text>
                <Text style={{ fontSize: 11, color: colors.muted }}>Posts</Text>
              </View>
              <View style={styles.stat}>
                <Text style={{ fontSize: 18, fontWeight: "800", color: colors.ink }}>{state.followers.length}</Text>
                <Text style={{ fontSize: 11, color: colors.muted }}>Followers</Text>
              </View>
              <View style={styles.stat}>
                <Text style={{ fontSize: 18, fontWeight: "800", color: colors.ink }}>{state.following.length}</Text>
                <Text style={{ fontSize: 11, color: colors.muted }}>Following</Text>
              </View>
              {state.followIncoming.length > 0 && (
                <Pressable onPress={() => router.push("/community/notifications" as any)} style={[styles.stat, { backgroundColor: "rgba(244,114,182,0.12)", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 }]}>
                  <Text style={{ fontSize: 16, fontWeight: "800", color: colors.pink }}>{state.followIncoming.length}</Text>
                  <Text style={{ fontSize: 10, color: colors.pink }}>Requests</Text>
                </Pressable>
              )}
            </View>

            <View style={{ flexDirection: "row", gap: 10, marginTop: space.md }}>
              <View style={{ flex: 1 }}>
                <GradientButton title="+ New Post" size="sm" onPress={() => router.push("/community/new-post")} />
              </View>
              <View style={{ flex: 1 }}>
                <GradientButton title="Edit Profile" size="sm" variant="ghost" onPress={() => router.push("/(tabs)/profile" as any)} />
              </View>
              <Pressable onPress={() => router.push(`/community/${me}` as any)} style={[styles.viewPostsBtn, { backgroundColor: colors.surface2, borderColor: colors.line }]}>
                <Icon name="community" size={16} color={colors.muted} />
              </Pressable>
            </View>
          </View>

          {/* Suggested people */}
          {suggested.length > 0 && (
            <View style={{ paddingVertical: space.md }}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: colors.ink, paddingHorizontal: space.lg, marginBottom: space.sm }}>People to follow</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: space.lg, gap: space.sm }}>
                {suggested.map((u) => (
                  <SuggestedCard key={u.username} username={u.username} avatar={u.avatar} bio={u.bio} />
                ))}
              </ScrollView>
            </View>
          )}

          {/* Search & filters */}
          <View style={{ paddingHorizontal: space.lg, gap: space.sm }}>
            <View style={[styles.searchBox, { backgroundColor: colors.surface2, borderColor: colors.line }]}>
              <Icon name="search" size={16} color={colors.muted} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search posts, users, tags…"
                placeholderTextColor={colors.muted}
                style={{ flex: 1, color: colors.ink, paddingVertical: 8 }}
              />
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {(["all", "posts", "reels"] as const).map((f) => (
                <Pressable key={f} onPress={() => setFilter(f)} style={[styles.tab, { backgroundColor: filter === f ? "rgba(34,211,238,0.15)" : colors.surface2, borderColor: filter === f ? colors.cyan : colors.line }]}>
                  <Text style={{ fontSize: 12, color: filter === f ? colors.cyan : colors.muted, fontWeight: "700", textTransform: "capitalize" }}>{f}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Feed */}
          <View style={{ paddingHorizontal: space.lg, paddingTop: space.md, gap: space.md }}>
            {feed.length === 0 && (
              <View style={{ alignItems: "center", padding: space.xxl }}>
                <Icon name="community" size={36} color={colors.muted} />
                <Text style={{ fontSize: 13, color: colors.muted, marginTop: space.sm }}>No posts yet. Be the first!</Text>
              </View>
            )}
            {feed.map((p) => (
              <PostCard
                key={p.id}
                post={p}
                onLike={() => togglePostLike(p.id)}
                onRepost={() => togglePostRepost(p.id)}
                onSave={() => togglePostSave(p.id)}
                onOpenComments={() => router.push(`/community/comments/${p.id}` as any)}
                onOpenUser={() => router.push(`/community/${p.user}` as any)}
                onEdit={() => setEditingPost({ id: p.id, caption: p.caption })}
                onDelete={() => Alert.alert("Delete post?", "This can't be undone.", [
                  { text: "Cancel", style: "cancel" },
                  { text: "Delete", style: "destructive", onPress: () => deletePost(p.id) }
                ])}
              />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Edit caption modal */}
      <Modal visible={!!editingPost} transparent animationType="fade" onRequestClose={() => setEditingPost(null)}>
        <Pressable style={styles.postMenuOverlay} onPress={() => setEditingPost(null)}>
          <View style={[styles.editModal, { backgroundColor: colors.surface1, borderColor: colors.line }]} onStartShouldSetResponder={() => true}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.ink, marginBottom: space.sm }}>Edit Caption</Text>
            <TextInput
              value={editingPost?.caption || ""}
              onChangeText={(t) => setEditingPost((prev) => prev ? { ...prev, caption: t } : null)}
              style={[styles.editInput, { backgroundColor: colors.surface2, borderColor: colors.line, color: colors.ink }]}
              multiline
              autoFocus
            />
            <View style={{ flexDirection: "row", gap: 12, marginTop: space.md }}>
              <View style={{ flex: 1 }}>
                <GradientButton title="Save" onPress={() => { if (editingPost) editPost(editingPost.id, editingPost.caption); setEditingPost(null); }} />
              </View>
              <View style={{ flex: 1 }}>
                <GradientButton title="Cancel" variant="ghost" onPress={() => setEditingPost(null)} />
              </View>
            </View>
          </View>
        </Pressable>
      </Modal>
    </ScreenBackground>
  );
}

function SuggestedCard({ username, avatar, bio }: { username: string; avatar: string; bio: string }) {
  const { colors } = useTheme();
  const router = useRouter();
  const { followUser, unfollowUser, cancelFollowRequest, isFollowing, hasRequested, getUser } = useAppStore();
  const following = isFollowing(username);
  const requested = hasRequested(username);
  const user = getUser(username);
  const isPrivate = user?.privacy === "private";

  let label = "Follow";
  if (following) label = "Following";
  else if (requested) label = "Requested";
  else if (isPrivate) label = "Request";

  const handlePress = () => {
    if (following) unfollowUser(username);
    else if (requested) cancelFollowRequest(username);
    else followUser(username);
  };

  return (
    <Pressable onPress={() => router.push(`/community/${username}` as any)} style={[styles.suggCard, { backgroundColor: colors.surface1, borderColor: colors.line }]}>
      <View style={[styles.suggAvatar, { backgroundColor: colors.surface2 }]}><Text style={{ fontSize: 26 }}>{avatar}</Text></View>
      <Text style={{ fontSize: 13, fontWeight: "700", color: colors.ink, marginTop: 4 }} numberOfLines={1}>{username}</Text>
      <Text style={{ fontSize: 10, color: colors.muted, textAlign: "center" }} numberOfLines={2}>{bio}</Text>
      <Pressable
        onPress={handlePress}
        style={[styles.suggBtn, { backgroundColor: following || requested ? colors.surface2 : "rgba(34,211,238,0.18)", borderColor: following || requested ? colors.line : colors.cyan }]}
      >
        <Text style={{ fontSize: 11, fontWeight: "800", color: following || requested ? colors.muted : colors.cyan }}>{label}</Text>
      </Pressable>
    </Pressable>
  );
}

function PostCard({
  post, onLike, onRepost, onSave, onOpenComments, onOpenUser, onEdit, onDelete
}: {
  post: Post;
  onLike: () => void;
  onRepost: () => void;
  onSave: () => void;
  onOpenComments: () => void;
  onOpenUser: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const { colors } = useTheme();
  const { state } = useAppStore();
  const me = state.profile.username || state.profile.name || "you";
  const isMine = post.user === me;
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <Card padded={false}>
      <Pressable onPress={onOpenUser} style={styles.postHead}>
        <View style={[styles.avatar, { backgroundColor: colors.surface2 }]}>
          <Text style={{ fontSize: 18 }}>{post.avatar}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.ink }}>{post.user}</Text>
          <Text style={{ fontSize: 11, color: colors.muted }}>{post.kind === "reel" ? "🎬 Reel" : "📸 Post"} · {post.createdAt}</Text>
        </View>
        {post.kind === "reel" && (
          <View style={[styles.reelPill, { backgroundColor: colors.pink }]}>
            <Text style={{ color: "#fff", fontWeight: "800", fontSize: 10 }}>REEL</Text>
          </View>
        )}
        {isMine && (
          <Pressable onPress={() => setMenuOpen(true)} hitSlop={8} style={{ padding: 4 }}>
            <Icon name="more" size={18} color={colors.muted} />
          </Pressable>
        )}
      </Pressable>

      {post.image ? (
        post.kind === "reel" ? (
          <View style={{ position: "relative", backgroundColor: "#000" }}>
            <Image source={{ uri: post.image }} style={[styles.media, { aspectRatio: 9 / 16, maxHeight: 560 }]} resizeMode="cover" />
            {/* Right-side vertical actions overlaid on video */}
            <View style={reelStyles.rightActions}>
              <Pressable onPress={onLike} hitSlop={6} style={reelStyles.rightBtn}>
                <Icon name={post.liked ? "heartFilled" : "heart"} size={28} color={post.liked ? "#ef4444" : "#fff"} />
                <Text style={reelStyles.rightCount}>{post.likes}</Text>
              </Pressable>
              <Pressable onPress={onOpenComments} hitSlop={6} style={reelStyles.rightBtn}>
                <Icon name="comment" size={26} color="#fff" />
                <Text style={reelStyles.rightCount}>{post.comments.length}</Text>
              </Pressable>
              <Pressable onPress={onRepost} hitSlop={6} style={reelStyles.rightBtn}>
                <Icon name="repeat" size={26} color={post.reposted ? "#10b981" : "#fff"} />
                <Text style={reelStyles.rightCount}>{post.reposts}</Text>
              </Pressable>
              <Pressable onPress={onSave} hitSlop={6} style={reelStyles.rightBtn}>
                <Text style={{ fontSize: 24 }}>{post.saved ? "🔖" : "📑"}</Text>
              </Pressable>
            </View>
            {/* Bottom overlay: user + caption */}
            <View style={reelStyles.bottomOverlay}>
              <Text style={reelStyles.overlayUser} numberOfLines={1}>{post.user}</Text>
              {!!post.caption && <Text style={reelStyles.overlayCaption} numberOfLines={2}>{post.caption}</Text>}
              {post.tags.length > 0 && (
                <Text style={reelStyles.overlayTags} numberOfLines={1}>{post.tags.map((t) => `#${t}`).join("  ")}</Text>
              )}
            </View>
          </View>
        ) : (
          <Image source={{ uri: post.image }} style={[styles.media, { aspectRatio: 4 / 3 }]} resizeMode="cover" />
        )
      ) : null}

      {/* Bottom info area — only for non-reel posts */}
      {post.kind !== "reel" && (
        <View style={{ padding: space.md, gap: space.xs }}>
          <View style={styles.actionRow}>
            <Pressable onPress={onLike} hitSlop={8} style={styles.actionBtn}>
              <Icon name={post.liked ? "heartFilled" : "heart"} size={22} color={post.liked ? "#ef4444" : colors.ink} />
              <Text style={{ fontSize: 12, color: colors.muted }}>{post.likes}</Text>
            </Pressable>
            <Pressable onPress={onOpenComments} hitSlop={8} style={styles.actionBtn}>
              <Icon name="comment" size={20} color={colors.ink} />
              <Text style={{ fontSize: 12, color: colors.muted }}>{post.comments.length}</Text>
            </Pressable>
            <Pressable onPress={onRepost} hitSlop={8} style={styles.actionBtn}>
              <Icon name="repeat" size={22} color={post.reposted ? "#10b981" : colors.ink} />
              <Text style={{ fontSize: 12, color: post.reposted ? "#10b981" : colors.muted, fontWeight: post.reposted ? "800" : "500" }}>{post.reposts}</Text>
            </Pressable>
            <Pressable onPress={onSave} hitSlop={8} style={[styles.actionBtn, { marginLeft: "auto" }]}>
              <Text style={{ fontSize: 18, color: post.saved ? colors.amber : colors.ink }}>{post.saved ? "🔖" : "📑"}</Text>
            </Pressable>
          </View>

          <Text style={{ fontSize: 13, fontWeight: "700", color: colors.ink }}>{post.likes.toLocaleString()} likes</Text>
          <Text style={{ fontSize: 14, color: colors.ink }}>
            <Text style={{ fontWeight: "700" }}>{post.user}</Text>  {post.caption}
          </Text>
          {post.tags.length > 0 && (
            <Text style={{ color: colors.cyan, fontSize: 12 }}>{post.tags.map((t) => `#${t}`).join("  ")}</Text>
          )}

          {post.comments.length > 0 && (
            <Pressable onPress={onOpenComments}>
              <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>View all {post.comments.length} comments</Text>
            </Pressable>
          )}

          <Pressable onPress={onOpenComments} style={[styles.commentPlaceholder, { borderColor: colors.line }]}>
            <Icon name="comment" size={14} color={colors.muted} />
            <Text style={{ fontSize: 12, color: colors.muted }}>Add a comment…</Text>
          </Pressable>
        </View>
      )}

      {/* Post menu modal */}
      {isMine && (
        <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
          <Pressable style={styles.postMenuOverlay} onPress={() => setMenuOpen(false)}>
            <View style={[styles.postMenu, { backgroundColor: colors.surface1, borderColor: colors.line }]}>
              <Pressable onPress={() => { setMenuOpen(false); onEdit?.(); }} style={styles.postMenuItem}>
                <Icon name="edit" size={16} color={colors.ink} />
                <Text style={{ fontSize: 15, color: colors.ink }}>Edit Caption</Text>
              </Pressable>
              <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.line }} />
              <Pressable onPress={() => { setMenuOpen(false); onDelete?.(); }} style={styles.postMenuItem}>
                <Icon name="trash" size={16} color="#f87171" />
                <Text style={{ fontSize: 15, color: "#f87171" }}>Delete Post</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>
      )}
    </Card>
  );
}

const reelStyles = StyleSheet.create({
  rightActions: { position: "absolute", right: 12, bottom: 60, gap: 20, alignItems: "center", zIndex: 2 },
  rightBtn: { alignItems: "center", gap: 2 },
  rightCount: { color: "#fff", fontSize: 12, fontWeight: "800", textShadowColor: "rgba(0,0,0,0.8)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  bottomOverlay: { position: "absolute", left: 0, right: 60, bottom: 0, paddingHorizontal: 12, paddingBottom: 12, paddingTop: 20, gap: 3 },
  overlayUser: { color: "#fff", fontSize: 14, fontWeight: "800", textShadowColor: "rgba(0,0,0,0.9)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  overlayCaption: { color: "#fff", fontSize: 13, textShadowColor: "rgba(0,0,0,0.9)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  overlayTags: { color: "#a5f3fc", fontSize: 12, textShadowColor: "rgba(0,0,0,0.9)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 }
});

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth
  },
  iconBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: "center", justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth, position: "relative"
  },
  dot: {
    position: "absolute", top: -2, right: -2,
    minWidth: 16, height: 16, borderRadius: 8,
    alignItems: "center", justifyContent: "center", paddingHorizontal: 3
  },
  dotText: { color: "#fff", fontSize: 9, fontWeight: "800" },
  profileCard: { padding: space.lg, borderBottomWidth: StyleSheet.hairlineWidth },
  avatarCircle: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  statsRow: { flexDirection: "row", alignItems: "center", marginTop: space.md, gap: space.lg, flexWrap: "wrap" },
  stat: { alignItems: "center" },
  suggCard: { width: 140, padding: 12, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, alignItems: "center", gap: 4 },
  suggAvatar: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  suggBtn: { marginTop: 8, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth },
  tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth },
  viewPostsBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", borderWidth: StyleSheet.hairlineWidth },
  postHead: { flexDirection: "row", alignItems: "center", gap: 10, padding: space.md },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  reelPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  media: { width: "100%", backgroundColor: "#111" },
  actionRow: { flexDirection: "row", gap: space.lg, alignItems: "center", marginBottom: 2 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  commentPlaceholder: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, marginTop: space.sm
  },
  postMenuOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  postMenu: { width: 220, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, overflow: "hidden" },
  postMenuItem: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16 },
  editModal: { width: "85%", borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: space.lg },
  editInput: { minHeight: 80, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, padding: 12, fontSize: 14, textAlignVertical: "top" }
});
