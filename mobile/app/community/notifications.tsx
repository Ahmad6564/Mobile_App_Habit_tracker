import React from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import ScreenBackground from "../../src/components/ScreenBackground";
import Header from "../../src/components/Header";
import Icon from "../../src/components/Icon";
import { useTheme } from "../../src/ThemeContext";
import { space } from "../../src/theme";
import { Notif, useAppStore } from "../../src/store/useAppStore";

const typeMeta: Record<Notif["type"], { icon: string; color: string }> = {
  like: { icon: "heartFilled", color: "#ef4444" },
  comment: { icon: "comment", color: "#22d3ee" },
  repost: { icon: "repeat", color: "#10b981" },
  follow: { icon: "user", color: "#a78bfa" },
  follow_request: { icon: "user", color: "#f59e0b" },
  message: { icon: "paperPlane", color: "#22d3ee" }
};

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { state, markAllNotifsRead, markNotifRead, acceptFollow, declineFollow } = useAppStore();

  // Merge: incoming follow requests + notifications. Show requests at top.
  const requestItems: Notif[] = state.followIncoming
    .filter((u) => !state.notifications.some((n) => n.type === "follow_request" && n.from === u))
    .map((u) => ({ id: `req-${u}`, type: "follow_request", from: u, text: `${u} wants to follow you.`, ts: Date.now(), read: false }));

  const all = [...requestItems, ...state.notifications].sort((a, b) => b.ts - a.ts);

  return (
    <ScreenBackground>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <Header title="Notifications" back />
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: space.lg, paddingVertical: space.sm }}>
          <Text style={{ fontSize: 13, color: colors.muted }}>{all.length} total</Text>
          <Pressable onPress={markAllNotifsRead}><Text style={{ fontSize: 12, color: colors.cyan, fontWeight: "700" }}>Mark all read</Text></Pressable>
        </View>
        <FlatList
          data={all}
          keyExtractor={(n) => n.id}
          contentContainerStyle={{ padding: space.lg, gap: space.sm, paddingBottom: 80 }}
          ListEmptyComponent={
            <View style={{ alignItems: "center", padding: space.xxl }}>
              <Icon name="bell" size={32} color={colors.muted} />
              <Text style={{ color: colors.muted, marginTop: space.sm }}>No notifications yet.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const meta = typeMeta[item.type];
            const isRequest = item.type === "follow_request" && state.followIncoming.includes(item.from);
            return (
              <Pressable
                onPress={() => {
                  markNotifRead(item.id);
                  if (item.type === "message") router.push(`/community/chat/${item.from}` as any);
                  else if (item.postId) router.push(`/community/comments/${item.postId}` as any);
                  else router.push(`/community/${item.from}` as any);
                }}
                style={[styles.item, { backgroundColor: item.read ? colors.surface1 : "rgba(34,211,238,0.06)", borderColor: colors.line }]}
              >
                <View style={[styles.iconCircle, { backgroundColor: colors.surface2 }]}>
                  <Icon name={meta.icon} size={18} color={meta.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, color: colors.ink }}>{item.text}</Text>
                  <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>{timeAgo(item.ts)}</Text>
                  {isRequest && (
                    <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                      <Pressable onPress={() => acceptFollow(item.from)} style={[styles.btn, { backgroundColor: colors.cyan }]}>
                        <Text style={{ color: "#001018", fontWeight: "800", fontSize: 12 }}>Accept</Text>
                      </Pressable>
                      <Pressable onPress={() => declineFollow(item.from)} style={[styles.btn, { backgroundColor: colors.surface2, borderColor: colors.line, borderWidth: StyleSheet.hairlineWidth }]}>
                        <Text style={{ color: colors.ink, fontWeight: "700", fontSize: 12 }}>Decline</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
                {!item.read && <View style={[styles.unreadDot, { backgroundColor: colors.cyan }]} />}
              </Pressable>
            );
          }}
        />
      </SafeAreaView>
    </ScreenBackground>
  );
}

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

const styles = StyleSheet.create({
  item: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 12, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth },
  iconCircle: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  btn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 }
});
