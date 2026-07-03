import React, { useMemo, useState } from "react";
import { Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import ScreenBackground from "../../src/components/ScreenBackground";
import Header from "../../src/components/Header";
import GradientButton from "../../src/components/GradientButton";
import Icon from "../../src/components/Icon";
import { useTheme } from "../../src/ThemeContext";
import { space } from "../../src/theme";
import { useAppStore } from "../../src/store/useAppStore";

export default function UserProfileScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { username } = useLocalSearchParams<{ username: string }>();
  const uname = String(username || "");
  const {
    state, getUser, isFollowing, hasRequested, isBlocked,
    followUser, unfollowUser, cancelFollowRequest, blockUser, unblockUser
  } = useAppStore();
  const [activeTab, setActiveTab] = useState<"posts" | "reels">("posts");
  const [menuOpen, setMenuOpen] = useState(false);

  const me = state.profile.username || state.profile.name || "you";
  const isMe = uname === me;
  const user = getUser(uname);
  const blocked = isBlocked(uname);
  const following = isFollowing(uname);
  const requested = hasRequested(uname);
  const isPrivate = user?.privacy === "private";

  const userPosts = useMemo(() => state.posts.filter((p) => p.user === uname), [state.posts, uname]);
  const postCount = userPosts.filter((p) => (p.format || (p.image ? "gallery" : "text")) !== "video").length;
  const reelCount = userPosts.filter((p) => (p.format || (p.image ? "gallery" : "text")) === "video").length;
  const userAvatar = user?.avatar || userPosts[0]?.avatar || "👤";
  const bio = user?.bio || "Habit builder & wellness enthusiast";
  const followerCount = user?.followersCount ?? ((uname.length * 47 + 53) % 900 + 80);
  const followingCount = user?.followingCount ?? ((uname.length * 23 + 17) % 400 + 30);
  const canViewPosts = !blocked && (!isPrivate || following || isMe);

  const filtered = userPosts.filter((p) => {
    const format = p.format || (p.image ? "gallery" : "text");
    return activeTab === "posts" ? format !== "video" : format === "video";
  });

  const handleFollowPress = () => {
    if (following) {
      Alert.alert(`Unfollow ${uname}?`, "You will stop seeing their posts in your feed.", [
        { text: "Cancel", style: "cancel" },
        { text: "Unfollow", style: "destructive", onPress: () => unfollowUser(uname) }
      ]);
    } else if (requested) {
      Alert.alert("Cancel follow request?", "", [
        { text: "Keep", style: "cancel" },
        { text: "Cancel request", style: "destructive", onPress: () => cancelFollowRequest(uname) }
      ]);
    } else {
      followUser(uname);
    }
  };

  const handleBlock = () => {
    setMenuOpen(false);
    if (blocked) {
      unblockUser(uname);
    } else {
      Alert.alert(`Block ${uname}?`, "They won't see your posts and you won't see theirs.", [
        { text: "Cancel", style: "cancel" },
        { text: "Block", style: "destructive", onPress: () => blockUser(uname) }
      ]);
    }
  };

  let followLabel = "Follow";
  let followVariant: "primary" | "ghost" = "primary";
  if (following) { followLabel = "Following"; followVariant = "ghost"; }
  else if (requested) { followLabel = "Requested"; followVariant = "ghost"; }
  else if (isPrivate) { followLabel = "Request"; }

  return (
    <ScreenBackground>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <Header title={`@${uname}`} back />
        <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
          <View style={[styles.profileHeader, { borderBottomColor: colors.line }]}>
            {!isMe && (
              <Pressable onPress={() => setMenuOpen(true)} hitSlop={8} style={[styles.menuBtn, { backgroundColor: colors.surface2, borderColor: colors.line }]}>
                <Icon name="more" size={18} color={colors.ink} />
              </Pressable>
            )}
            <View style={[styles.avatarLarge, { backgroundColor: colors.surface2, borderColor: colors.line }]}>
              <Text style={{ fontSize: 36 }}>{userAvatar}</Text>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: space.md }}>
              <Text style={{ fontSize: 20, fontWeight: "800", color: colors.ink }}>{uname}</Text>
              {isPrivate && <Icon name="lock" size={14} color={colors.muted} />}
            </View>
            <Text style={{ fontSize: 13, color: colors.muted, textAlign: "center", paddingHorizontal: space.lg }}>{bio}</Text>

            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={{ fontSize: 18, fontWeight: "800", color: colors.ink }}>{userPosts.length}</Text>
                <Text style={{ fontSize: 12, color: colors.muted }}>Posts</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.line }]} />
              <View style={styles.stat}>
                <Text style={{ fontSize: 18, fontWeight: "800", color: colors.ink }}>{followerCount}</Text>
                <Text style={{ fontSize: 12, color: colors.muted }}>Followers</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.line }]} />
              <View style={styles.stat}>
                <Text style={{ fontSize: 18, fontWeight: "800", color: colors.ink }}>{followingCount}</Text>
                <Text style={{ fontSize: 12, color: colors.muted }}>Following</Text>
              </View>
            </View>

            {blocked ? (
              <View style={{ marginTop: space.md, width: "100%" }}>
                <GradientButton title="Unblock" variant="ghost" onPress={() => unblockUser(uname)} />
              </View>
            ) : !isMe ? (
              <View style={{ flexDirection: "row", gap: 8, marginTop: space.md, width: "100%" }}>
                <View style={{ flex: 1 }}>
                  <GradientButton title={followLabel} variant={followVariant} onPress={handleFollowPress} />
                </View>
                <View style={{ flex: 1 }}>
                  <GradientButton title="Message" variant="ghost" onPress={() => router.push(`/community/chat/${uname}` as any)} />
                </View>
              </View>
            ) : null}
          </View>

          {!canViewPosts ? (
            <View style={{ alignItems: "center", padding: space.xxl }}>
              <Icon name="lock" size={36} color={colors.muted} />
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.ink, marginTop: space.sm }}>This account is private</Text>
              <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>Follow {uname} to see their posts.</Text>
            </View>
          ) : (
            <>
              <View style={[styles.tabRow, { borderBottomColor: colors.line }]}>
                <Pressable onPress={() => setActiveTab("posts")} style={[styles.tabItem, activeTab === "posts" && { borderBottomColor: colors.cyan, borderBottomWidth: 2 }]}>
                  <Icon name="community" size={20} color={activeTab === "posts" ? colors.cyan : colors.muted} />
                  <Text style={{ fontSize: 12, color: activeTab === "posts" ? colors.ink : colors.muted, fontWeight: "600" }}>Posts ({postCount})</Text>
                </Pressable>
                <Pressable onPress={() => setActiveTab("reels")} style={[styles.tabItem, activeTab === "reels" && { borderBottomColor: colors.pink, borderBottomWidth: 2 }]}>
                  <Icon name="spark" size={20} color={activeTab === "reels" ? colors.pink : colors.muted} />
                  <Text style={{ fontSize: 12, color: activeTab === "reels" ? colors.ink : colors.muted, fontWeight: "600" }}>Reels ({reelCount})</Text>
                </Pressable>
              </View>

              {filtered.length === 0 ? (
                <View style={{ alignItems: "center", padding: space.xxl }}>
                  <Text style={{ fontSize: 13, color: colors.muted }}>No {activeTab} yet.</Text>
                </View>
              ) : (
                <View style={styles.grid}>
                  {filtered.map((p) => (
                    <Pressable key={p.id} onPress={() => router.push(`/community/comments/${p.id}` as any)} style={styles.gridItem}>
                      {(p.media?.[0] || p.image) ? (
                        <Image source={{ uri: p.media?.[0] || p.image }} style={styles.gridImg} />
                      ) : (
                        <View style={[styles.gridImg, { backgroundColor: colors.surface2, justifyContent: "center", alignItems: "center" }]}>
                          <Text style={{ fontSize: 11, color: colors.muted, textAlign: "center", padding: 4 }} numberOfLines={3}>{p.caption}</Text>
                        </View>
                      )}
                      {(p.format || (p.image ? "gallery" : "text")) === "video" && (
                        <View style={styles.reelBadge}>
                          <Icon name="play" size={10} color="#fff" />
                        </View>
                      )}
                      <View style={styles.gridOverlay}>
                        <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>♥ {p.likes}</Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>

        <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
          <Pressable style={styles.backdrop} onPress={() => setMenuOpen(false)}>
            <View style={[styles.sheet, { backgroundColor: colors.surface1, borderColor: colors.line }]}>
              <Pressable onPress={handleBlock} style={styles.sheetItem}>
                <Icon name="block" size={18} color={blocked ? colors.cyan : "#ef4444"} />
                <Text style={{ color: blocked ? colors.cyan : "#ef4444", fontWeight: "700", fontSize: 14 }}>{blocked ? "Unblock" : "Block"} {uname}</Text>
              </Pressable>
              <Pressable onPress={() => { setMenuOpen(false); Alert.alert("Reported", "Thanks. We will review."); }} style={styles.sheetItem}>
                <Icon name="shield" size={18} color={colors.muted} />
                <Text style={{ color: colors.ink, fontWeight: "700", fontSize: 14 }}>Report</Text>
              </Pressable>
              <Pressable onPress={() => setMenuOpen(false)} style={[styles.sheetItem, { justifyContent: "center" }]}>
                <Text style={{ color: colors.muted, fontWeight: "700", fontSize: 14 }}>Cancel</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  profileHeader: { alignItems: "center", padding: space.xl, borderBottomWidth: StyleSheet.hairlineWidth, position: "relative" },
  menuBtn: { position: "absolute", top: 12, right: 12, width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", borderWidth: StyleSheet.hairlineWidth, zIndex: 2 },
  avatarLarge: { width: 90, height: 90, borderRadius: 45, alignItems: "center", justifyContent: "center", borderWidth: 2 },
  statsRow: { flexDirection: "row", alignItems: "center", marginTop: space.lg, gap: space.lg },
  stat: { alignItems: "center" },
  statDivider: { width: 1, height: 28 },
  tabRow: { flexDirection: "row", borderBottomWidth: StyleSheet.hairlineWidth },
  tabItem: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14 },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  gridItem: { width: "33.33%", aspectRatio: 1, padding: 1, position: "relative" },
  gridImg: { width: "100%", height: "100%", borderRadius: 2 },
  reelBadge: { position: "absolute", top: 6, right: 6, backgroundColor: "rgba(244,114,182,0.9)", borderRadius: 4, padding: 3 },
  gridOverlay: { position: "absolute", bottom: 6, left: 6 },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 16, borderTopRightRadius: 16, borderTopWidth: StyleSheet.hairlineWidth, paddingVertical: space.sm },
  sheetItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: space.lg, paddingVertical: 14 }
});
