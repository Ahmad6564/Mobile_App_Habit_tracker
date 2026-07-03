import React, { useMemo, useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  Share,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  ViewToken
} from "react-native";
import { Video, ResizeMode } from "expo-av";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import ScreenBackground from "../../src/components/ScreenBackground";
import CommunityActionStack from "../../src/components/CommunityActionStack";
import Icon from "../../src/components/Icon";
import { useAppStore } from "../../src/store/useAppStore";

export default function ReelsScreen() {
  const router = useRouter();
  const { height, width } = useWindowDimensions();
  const { postId } = useLocalSearchParams<{ postId?: string }>();
  const {
    state,
    togglePostLike,
    togglePostRepost,
    togglePostSave,
    followUser,
    unfollowUser,
    cancelFollowRequest,
    isFollowing,
    hasRequested
  } = useAppStore();
  const [activeIndex, setActiveIndex] = useState(0);
  const [muted, setMuted] = useState(false);
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 75 }).current;

  const reels = useMemo(
    () =>
      state.posts.filter((p) => {
        const media = p.media?.length ? p.media : p.image ? [p.image] : [];
        const format = p.format || (media.length ? "gallery" : "text");
        return format === "video" && media.length > 0;
      }),
    [state.posts]
  );

  const initialIndex = useMemo(() => {
    if (!postId) return 0;
    const idx = reels.findIndex((p) => p.id === postId);
    return idx >= 0 ? idx : 0;
  }, [postId, reels]);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const first = viewableItems[0];
    if (first?.index != null) setActiveIndex(first.index);
  }).current;

  if (reels.length === 0) {
    return (
      <ScreenBackground>
        <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
          <View style={{ padding: 16, flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <Icon name="back" size={22} color="#fff" />
            </Pressable>
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "800" }}>Reels</Text>
          </View>
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
            <Text style={{ color: "rgba(255,255,255,0.75)" }}>No video reels yet.</Text>
          </View>
        </SafeAreaView>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={styles.iconBtn}>
            <Icon name="back" size={22} color="#fff" />
          </Pressable>
          <Text style={styles.topTitle}>Reels</Text>
          <Pressable onPress={() => setMuted((m) => !m)} hitSlop={8} style={styles.iconBtn}>
            <Icon name={muted ? "mute" : "music"} size={20} color="#fff" />
          </Pressable>
        </View>

        <FlatList
          data={reels}
          keyExtractor={(item) => item.id}
          pagingEnabled
          initialScrollIndex={initialIndex}
          getItemLayout={(_, index) => ({ length: height, offset: height * index, index })}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => {
            const media = item.media?.length ? item.media : [item.image];
            const following = isFollowing(item.user);
            const requested = hasRequested(item.user);
            const canFollow = item.user !== (state.profile.username || state.profile.name || "you");

            const onToggleFollow = () => {
              if (following) {
                unfollowUser(item.user);
                return;
              }
              if (requested) {
                cancelFollowRequest(item.user);
                return;
              }
              followUser(item.user);
            };

            return (
              <View style={{ width, height, backgroundColor: "#000" }}>
                <Video
                  source={{ uri: media[0] }}
                  style={StyleSheet.absoluteFill}
                  resizeMode={ResizeMode.COVER}
                  shouldPlay={activeIndex === index}
                  isLooping
                  isMuted={muted}
                />
                <Pressable
                  onPress={() => setMuted((m) => !m)}
                  style={StyleSheet.absoluteFill}
                />

                <CommunityActionStack
                  liked={item.liked}
                  likes={item.likes}
                  comments={item.comments.length}
                  reposted={item.reposted}
                  reposts={item.reposts}
                  saved={item.saved}
                  following={following}
                  canFollow={canFollow}
                  onLike={() => togglePostLike(item.id)}
                  onComment={() => router.push(`/community/comments/${item.id}` as any)}
                  onRepost={() => togglePostRepost(item.id)}
                  onSave={() => togglePostSave(item.id)}
                  onShare={async () => {
                    try {
                      await Share.share({ message: `${item.user}: ${item.caption}` });
                    } catch {
                      // ignore
                    }
                  }}
                  onFollow={onToggleFollow}
                />

                <View style={styles.bottomMeta}>
                  <Pressable onPress={() => router.push(`/community/${item.user}` as any)}>
                    <Text style={styles.userName}>@{item.user}</Text>
                  </Pressable>
                  <Text style={styles.caption} numberOfLines={3}>{item.caption}</Text>
                  {item.song ? (
                    <View style={styles.songRow}>
                      <Icon name="music" size={12} color="#fff" />
                      <Text style={styles.songText} numberOfLines={1}>{item.song}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            );
          }}
        />
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  topBar: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    zIndex: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 4
  },
  topTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.4)"
  },
  bottomMeta: {
    position: "absolute",
    left: 12,
    right: 70,
    bottom: 16,
    gap: 6
  },
  userName: { color: "#fff", fontSize: 14, fontWeight: "800" },
  caption: { color: "#fff", fontSize: 13 },
  songRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.35)"
  },
  songText: { color: "#fff", fontSize: 11, fontWeight: "700" }
});
