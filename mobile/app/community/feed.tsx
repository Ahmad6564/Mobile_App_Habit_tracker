import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import ScreenBackground from "../../src/components/ScreenBackground";
import Card from "../../src/components/Card";
import Header from "../../src/components/Header";
import Icon from "../../src/components/Icon";
import { useTheme } from "../../src/ThemeContext";
import { space } from "../../src/theme";
import { Post, useAppStore } from "../../src/store/useAppStore";

const PAGE_SIZE = 8;

export default function CommunityFeedScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { state } = useAppStore();
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const feed = useMemo(() => {
    return state.posts
      .filter((p) => !state.blocked.includes(p.user))
      .filter((p) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          p.user.toLowerCase().includes(q) ||
          p.caption.toLowerCase().includes(q) ||
          (p.song || "").toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
        );
      });
  }, [state.posts, state.blocked, search]);

  const visibleFeed = useMemo(() => feed.slice(0, visibleCount), [feed, visibleCount]);
  const hasMore = visibleCount < feed.length;

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search]);

  return (
    <ScreenBackground>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <Header title="Community Feed" back />
        <View style={{ paddingHorizontal: space.lg, paddingBottom: space.sm }}>
          <View style={[styles.searchBox, { backgroundColor: colors.surface2, borderColor: colors.line }]}>
            <Icon name="search" size={16} color={colors.muted} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search posts, users, songs, tags"
              placeholderTextColor={colors.muted}
              style={{ flex: 1, color: colors.ink, paddingVertical: 8 }}
            />
          </View>
        </View>

        <FlatList
          data={visibleFeed}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: 110, gap: space.md }}
          renderItem={({ item }) => <FeedPostCard post={item} />}
          onEndReachedThreshold={0.55}
          onEndReached={() => {
            if (hasMore) setVisibleCount((v) => Math.min(v + PAGE_SIZE, feed.length));
          }}
          ListFooterComponent={
            <View style={{ alignItems: "center", paddingVertical: 14 }}>
              <Text style={{ fontSize: 12, color: colors.muted }}>
                {hasMore ? "Loading more..." : "You are all caught up"}
              </Text>
            </View>
          }
        />
      </SafeAreaView>
    </ScreenBackground>
  );
}

function FeedPostCard({ post }: { post: Post }) {
  const router = useRouter();
  const { colors } = useTheme();
  const {
    state,
    togglePostLike,
    togglePostSave,
    togglePostRepost,
    followUser,
    unfollowUser,
    cancelFollowRequest,
    isFollowing,
    hasRequested
  } = useAppStore();

  const me = state.profile.username || state.profile.name || "you";
  const isMine = post.user === me;
  const following = isFollowing(post.user);
  const requested = hasRequested(post.user);
  const media = post.media?.length ? post.media : post.image ? [post.image] : [];
  const format = post.format || (media.length ? "gallery" : "text");

  const onToggleFollow = () => {
    if (following) {
      unfollowUser(post.user);
      return;
    }
    if (requested) {
      cancelFollowRequest(post.user);
      return;
    }
    followUser(post.user);
  };

  const onShare = async () => {
    try {
      await Share.share({ message: `${post.user}: ${post.caption}` });
    } catch {
      // ignore
    }
  };

  return (
    <Card padded={false}>
      <Pressable onPress={() => router.push(`/community/${post.user}` as any)} style={styles.head}>
        <View style={[styles.avatar, { backgroundColor: colors.surface2 }]}>
          <Text style={{ fontSize: 18 }}>{post.avatar}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.ink }}>{post.user}</Text>
          <Text style={{ fontSize: 11, color: colors.muted }}>{post.createdAt}</Text>
        </View>
        {!isMine ? (
          <Pressable onPress={onToggleFollow} style={[styles.followBtn, { borderColor: colors.line, backgroundColor: following ? colors.surface2 : "rgba(34,211,238,0.16)" }]}>
            <Text style={{ fontSize: 11, fontWeight: "800", color: following ? colors.muted : colors.cyan }}>
              {following ? "Following" : requested ? "Requested" : "Follow"}
            </Text>
          </Pressable>
        ) : null}
      </Pressable>

      {format === "text" ? (
        <View style={[styles.textPost, { borderTopColor: colors.line, borderBottomColor: colors.line }]}>
          <Text style={{ fontSize: 17, lineHeight: 26, color: colors.ink, fontWeight: "600" }}>{post.caption}</Text>
        </View>
      ) : format === "video" ? (
        <Pressable onPress={() => router.push({ pathname: "/community/reels" as any, params: { postId: post.id } })}>
          <Image source={{ uri: media[0] }} style={styles.media} />
          <View style={styles.playOverlay}>
            <Icon name="play" size={42} color="#fff" />
          </View>
        </Pressable>
      ) : (
        <Image source={{ uri: media[0] }} style={styles.media} />
      )}

      <View style={{ padding: space.md, gap: 6 }}>
        <View style={styles.actions}>
          <View style={{ flexDirection: "row", gap: 18 }}>
            <Pressable onPress={() => togglePostLike(post.id)}>
              <Icon name={post.liked ? "heartFilled" : "heart"} size={23} color={post.liked ? "#ef4444" : colors.ink} />
            </Pressable>
            <Pressable onPress={() => router.push(`/community/comments/${post.id}` as any)}>
              <Icon name="comment" size={22} color={colors.ink} />
            </Pressable>
            <Pressable onPress={() => togglePostRepost(post.id)}>
              <Icon name="repeat" size={23} color={post.reposted ? "#10b981" : colors.ink} />
            </Pressable>
            <Pressable onPress={onShare}>
              <Icon name="share" size={22} color={colors.ink} />
            </Pressable>
          </View>
          <Pressable onPress={() => togglePostSave(post.id)}>
            <Text style={{ fontSize: 20, color: post.saved ? colors.amber : colors.ink }}>{post.saved ? "🔖" : "📑"}</Text>
          </Pressable>
        </View>

        <Text style={{ color: colors.ink, fontSize: 13, fontWeight: "700" }}>{post.likes.toLocaleString()} likes</Text>
        <Text style={{ color: colors.ink, fontSize: 13 }}>
          <Text style={{ fontWeight: "700" }}>{post.user}</Text> {post.caption}
        </Text>
        {post.song ? (
          <Text style={{ fontSize: 12, color: colors.muted }}>♫ {post.song}</Text>
        ) : null}
        {post.tags.length > 0 ? (
          <Text style={{ fontSize: 12, color: colors.cyan }}>{post.tags.map((t) => `#${t}`).join("  ")}</Text>
        ) : null}
        <Pressable onPress={() => router.push(`/community/comments/${post.id}` as any)}>
          <Text style={{ fontSize: 12, color: colors.muted }}>View all {post.comments.length} comments</Text>
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth
  },
  head: { flexDirection: "row", alignItems: "center", gap: 10, padding: space.md },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  followBtn: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  textPost: { paddingHorizontal: space.md, paddingVertical: space.lg, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth },
  media: { width: "100%", aspectRatio: 4 / 5, backgroundColor: "#111" },
  playOverlay: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
  actions: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }
});
