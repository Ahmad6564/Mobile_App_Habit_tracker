import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import ScreenBackground from "../src/components/ScreenBackground";
import GradientButton from "../src/components/GradientButton";
import BrandMark from "../src/components/BrandMark";
import { useTheme } from "../src/ThemeContext";
import { space } from "../src/theme";

export default function Landing() {
  const router = useRouter();
  const { colors } = useTheme();

  const FEATURES = [
    { icon: "✦", title: "Daily Matrix", sub: "See every habit, every day, at a glance.", color: colors.cyan },
    { icon: "✦", title: "AI Coach", sub: "Personalised nudges built from your streaks.", color: colors.violet },
    { icon: "✦", title: "Nutrition AI", sub: "Snap a meal, get macros and tips.", color: colors.pink },
    { icon: "✦", title: "Community", sub: "Share reels, posts and journey logs.", color: colors.emerald }
  ];

  return (
    <ScreenBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.topRow}>
            <BrandMark size={42} />
            <Text style={[styles.brandWord, { color: colors.ink }]}>HabitForge</Text>
          </View>

          <View style={styles.heroBlock}>
            <View style={styles.badge}>
              <Text style={[styles.badgeText, { color: colors.cyan }]}>Habit + Community + AI</Text>
            </View>
            <Text style={[styles.headline, { color: colors.ink }]}>
              Build better routines.{"\n"}Show your journey.{"\n"}Eat smarter with AI.
            </Text>
            <Text style={[styles.sub, { color: colors.muted }]}>
              Track daily, weekly, and monthly habits, share reels and stories with the
              community, and get instant nutrition insights from meal photos.
            </Text>

            <View style={styles.ctaRow}>
              <GradientButton
                title="Start Free"
                onPress={() => router.replace("/(auth)/sign-up")}
                fullWidth
              />
              <GradientButton
                title="View Demo Dashboard"
                variant="ghost"
                onPress={() => router.replace("/(tabs)")}
                fullWidth
              />
            </View>
          </View>

          <View style={styles.featureGrid}>
            {FEATURES.map((f) => (
              <View key={f.title} style={[styles.feature, { backgroundColor: colors.surface, borderColor: colors.line }]}>
                <Text style={{ fontSize: 16, fontWeight: "700", color: f.color }}>{f.icon}</Text>
                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.ink }}>{f.title}</Text>
                <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>{f.sub}</Text>
              </View>
            ))}
          </View>

          <Text style={{ fontSize: 12, color: colors.muted, textAlign: "center", marginTop: space.xxl }}>
            track · build · share
          </Text>
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: space.xl, paddingBottom: space.xxl * 2 },
  topRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: space.xxl },
  brandWord: { fontSize: 18, fontWeight: "700", letterSpacing: 0.3 },
  heroBlock: { gap: space.lg },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(34,211,238,0.16)",
    borderColor: "rgba(34,211,238,0.4)",
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999
  },
  badgeText: { fontWeight: "700", fontSize: 12, letterSpacing: 0.5 },
  headline: { fontSize: 34, fontWeight: "800", lineHeight: 40, letterSpacing: -0.5 },
  sub: { fontSize: 15, lineHeight: 22 },
  ctaRow: { gap: space.sm, marginTop: space.md },
  featureGrid: { marginTop: space.xxl, flexDirection: "row", flexWrap: "wrap", gap: space.md },
  feature: {
    flexBasis: "47%",
    flexGrow: 1,
    padding: space.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14
  }
});
