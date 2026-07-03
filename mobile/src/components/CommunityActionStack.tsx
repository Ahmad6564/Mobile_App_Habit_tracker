import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Icon from "./Icon";

type Props = {
  liked: boolean;
  likes: number;
  comments: number;
  reposted: boolean;
  reposts: number;
  saved: boolean;
  following?: boolean;
  canFollow?: boolean;
  onLike: () => void;
  onComment?: () => void;
  onRepost: () => void;
  onSave: () => void;
  onShare?: () => void;
  onFollow?: () => void;
};

export default function CommunityActionStack({
  liked,
  likes,
  comments,
  reposted,
  reposts,
  saved,
  following,
  canFollow,
  onLike,
  onComment,
  onRepost,
  onSave,
  onShare,
  onFollow
}: Props) {
  return (
    <View style={styles.rightActions}>
      <Pressable onPress={onLike} hitSlop={6} style={styles.rightBtn}>
        <Icon name={liked ? "heartFilled" : "heart"} size={28} color={liked ? "#ef4444" : "#fff"} />
        <Text style={styles.rightCount}>{likes}</Text>
      </Pressable>
      <Pressable onPress={onComment} disabled={!onComment} hitSlop={6} style={styles.rightBtn}>
        <Icon name="comment" size={26} color="#fff" />
        <Text style={styles.rightCount}>{comments}</Text>
      </Pressable>
      <Pressable onPress={onRepost} hitSlop={6} style={styles.rightBtn}>
        <Icon name="repeat" size={26} color={reposted ? "#10b981" : "#fff"} />
        <Text style={styles.rightCount}>{reposts}</Text>
      </Pressable>
      <Pressable onPress={onSave} hitSlop={6} style={styles.rightBtn}>
        <Text style={{ fontSize: 24 }}>{saved ? "🔖" : "📑"}</Text>
      </Pressable>
      <Pressable onPress={onShare} disabled={!onShare} hitSlop={6} style={styles.rightBtn}>
        <Icon name="share" size={24} color="#fff" />
      </Pressable>
      {canFollow ? (
        <Pressable onPress={onFollow} hitSlop={6} style={styles.followBtn}>
          <Text style={styles.followText}>{following ? "Following" : "Follow"}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  rightActions: { position: "absolute", right: 12, bottom: 60, gap: 20, alignItems: "center", zIndex: 2 },
  rightBtn: { alignItems: "center", gap: 2 },
  rightCount: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4
  },
  followBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.45)",
    backgroundColor: "rgba(0,0,0,0.35)"
  },
  followText: { color: "#fff", fontSize: 11, fontWeight: "800" }
});
