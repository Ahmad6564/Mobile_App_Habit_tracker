import React, { useMemo } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import ScreenBackground from "../../src/components/ScreenBackground";
import Header from "../../src/components/Header";
import Icon from "../../src/components/Icon";
import { useTheme } from "../../src/ThemeContext";
import { space } from "../../src/theme";
import { useAppStore } from "../../src/store/useAppStore";

export default function MessagesScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { state } = useAppStore();

  const conversations = useMemo(() => {
    const entries = Object.entries(state.dms).map(([username, msgs]) => {
      const last = msgs[msgs.length - 1];
      return { username, last, count: msgs.length };
    });
    return entries.sort((a, b) => (b.last?.ts || 0) - (a.last?.ts || 0));
  }, [state.dms]);

  return (
    <ScreenBackground>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <Header title="Messages" back />
        <View style={{ paddingHorizontal: space.lg, paddingTop: space.sm }}>
          <Text style={{ fontSize: 13, color: colors.muted }}>Tip: tap any user → Message. No follow required.</Text>
        </View>
        <FlatList
          data={conversations}
          keyExtractor={(c) => c.username}
          contentContainerStyle={{ padding: space.lg, gap: space.sm, paddingBottom: 80 }}
          ListEmptyComponent={
            <View style={{ alignItems: "center", padding: space.xxl }}>
              <Icon name="paperPlane" size={32} color={colors.muted} />
              <Text style={{ color: colors.muted, marginTop: space.sm }}>No conversations yet.</Text>
              <Text style={{ color: colors.muted, marginTop: 4, fontSize: 12 }}>Open a profile and tap Message to start.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const user = state.users.find((u) => u.username === item.username);
            return (
              <Pressable
                onPress={() => router.push(`/community/chat/${item.username}` as any)}
                style={[styles.item, { backgroundColor: colors.surface1, borderColor: colors.line }]}
              >
                <View style={[styles.avatar, { backgroundColor: colors.surface2 }]}>
                  <Text style={{ fontSize: 20 }}>{user?.avatar || item.username.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: colors.ink }}>{item.username}</Text>
                  <Text numberOfLines={1} style={{ fontSize: 13, color: colors.muted }}>{item.last?.text || "Say hi"}</Text>
                </View>
                <Text style={{ fontSize: 11, color: colors.muted }}>{timeAgo(item.last?.ts || 0)}</Text>
              </Pressable>
            );
          }}
        />
      </SafeAreaView>
    </ScreenBackground>
  );
}

function timeAgo(ts: number) {
  if (!ts) return "";
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
  item: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" }
});
