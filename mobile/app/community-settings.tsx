import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import ScreenBackground from "../src/components/ScreenBackground";
import Header from "../src/components/Header";
import Card from "../src/components/Card";
import Icon from "../src/components/Icon";
import { useTheme } from "../src/ThemeContext";
import { space } from "../src/theme";
import { useAppStore } from "../src/store/useAppStore";

export default function CommunitySettingsScreen() {
  const { colors } = useTheme();
  const { state, updateSettings } = useAppStore();
  const s = state.settings;
  const [allowComments, setAllowComments] = useState(true);
  const [showActivity, setShowActivity] = useState(true);

  return (
    <ScreenBackground>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <Header title="Community Settings" back />
        <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md, paddingBottom: 80 }}>
          <Text style={{ fontSize: 22, fontWeight: "800", color: colors.ink }}>Community Settings</Text>
          <Text style={{ fontSize: 13, color: colors.muted }}>Control how others interact with your profile and content.</Text>

          {/* Privacy */}
          <Card>
            <View style={styles.sectionHead}>
              <Icon name="user" size={18} color={colors.violet} />
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.ink }}>Account Privacy</Text>
            </View>
            <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>
              When private, only approved followers can see your posts and activity.
            </Text>
            <View style={{ flexDirection: "row", gap: 8, marginTop: space.md }}>
              {(["public", "followers", "private"] as const).map((p) => {
                const active = s.privacy === p;
                return (
                  <Pressable key={p} onPress={() => updateSettings({ privacy: p })} style={[styles.chip, { backgroundColor: active ? "rgba(34,211,238,0.15)" : colors.surface2, borderColor: active ? colors.cyan : colors.line }]}>
                    <Text style={{ fontSize: 12, color: active ? colors.cyan : colors.muted, fontWeight: "700", textTransform: "capitalize" }}>{p}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Card>

          {/* Comments */}
          <Card>
            <View style={styles.sectionHead}>
              <Icon name="chat" size={18} color={colors.cyan} />
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.ink }}>Comments</Text>
            </View>
            <View style={[styles.row, { marginTop: space.md }]}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "500", color: colors.ink }}>Allow comments on posts</Text>
                <Text style={{ fontSize: 12, color: colors.muted }}>Others can comment on your posts</Text>
              </View>
              <Switch
                value={allowComments}
                onValueChange={setAllowComments}
                trackColor={{ true: colors.cyan, false: "#444" }}
                thumbColor="#fff"
              />
            </View>
          </Card>

          {/* Activity */}
          <Card>
            <View style={styles.sectionHead}>
              <Icon name="spark" size={18} color={colors.emerald} />
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.ink }}>Activity Status</Text>
            </View>
            <View style={[styles.row, { marginTop: space.md }]}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "500", color: colors.ink }}>Show activity status</Text>
                <Text style={{ fontSize: 12, color: colors.muted }}>Others see when you're active</Text>
              </View>
              <Switch
                value={showActivity}
                onValueChange={setShowActivity}
                trackColor={{ true: colors.emerald, false: "#444" }}
                thumbColor="#fff"
              />
            </View>
          </Card>

          {/* Blocked */}
          <Card>
            <View style={styles.sectionHead}>
              <Icon name="close" size={18} color={colors.danger} />
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.ink }}>Blocked Users</Text>
            </View>
            <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>No blocked users yet.</Text>
          </Card>
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  sectionHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth }
});
