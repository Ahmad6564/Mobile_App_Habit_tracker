import React, { useState } from "react";
import { Linking, Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { SafeAreaView } from "react-native-safe-area-context";
import ScreenBackground from "../src/components/ScreenBackground";
import Header from "../src/components/Header";
import Card from "../src/components/Card";
import GradientButton from "../src/components/GradientButton";
import Icon from "../src/components/Icon";
import { space } from "../src/theme";
import { useTheme } from "../src/ThemeContext";
import { useAppStore } from "../src/store/useAppStore";

export default function ReferralScreen() {
  const { colors } = useTheme();
  const { state } = useAppStore();
  const code = state.profile.referralCode;
  const link = `https://habitforge.app/sign-up?ref=${code}`;
  const [copied, setCopied] = useState<string>("");

  const copy = async (val: string, key: string) => {
    try { await Clipboard.setStringAsync(val); } catch {}
    setCopied(key); setTimeout(() => setCopied(""), 1500);
  };

  const shareNow = async () => {
    try {
      await Share.share({ title: "Join me on HabitForge", message: `I am building habits on HabitForge. Use my code ${code}: ${link}` });
    } catch {}
  };

  const channels = [
    { key: "whatsapp", label: "WhatsApp", url: `whatsapp://send?text=${encodeURIComponent(`Join me on HabitForge — ${link}`)}` },
    { key: "twitter", label: "X / Twitter", url: `https://twitter.com/intent/tweet?text=${encodeURIComponent("Building habits the smart way on HabitForge")}&url=${encodeURIComponent(link)}` },
    { key: "email", label: "Email", url: `mailto:?subject=${encodeURIComponent("Join HabitForge")}&body=${encodeURIComponent(`Use my code ${code}: ${link}`)}` }
  ];

  return (
    <ScreenBackground>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <Header title="Refer a friend" />
        <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md, paddingBottom: 80 }}>
          <Card>
            <Text style={{ fontSize: 11, color: colors.cyan, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase" }}>Refer a friend</Text>
            <Text style={{ fontSize: 28, fontWeight: "800", color: colors.ink, letterSpacing: -0.5, marginTop: 4 }}>Build habits together</Text>
            <Text style={{ fontSize: 13, color: colors.muted, marginTop: space.xs }}>
              Share HabitForge with friends. Both of you get a streak boost and a referral badge when they sign up with your code.
            </Text>

            <View style={[styles.codeBox, { backgroundColor: colors.surface2, borderColor: colors.line }]}>
              <Text style={{ fontSize: 12, color: colors.muted }}>Your code</Text>
              <Text style={{ fontSize: 28, fontWeight: "800", color: colors.ink, letterSpacing: 4, marginTop: 4 }}>{code}</Text>
              <Pressable onPress={() => copy(code, "code")} style={[styles.copyBtn, { borderColor: colors.cyan }]}>
                <Text style={{ fontSize: 12, color: colors.ink, fontWeight: "700" }}>
                  {copied === "code" ? "Copied ✓" : "Copy code"}
                </Text>
              </Pressable>
            </View>
          </Card>

          <Card>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.ink }}>Share link</Text>
            <View style={[styles.linkRow, { backgroundColor: colors.surface2, borderColor: colors.line }]}>
              <Text style={{ fontSize: 12, color: colors.muted, flex: 1 }} numberOfLines={1}>{link}</Text>
              <Pressable onPress={() => copy(link, "link")} style={[styles.copyBtn, { borderColor: colors.cyan }]}>
                <Text style={{ fontSize: 12, color: colors.ink, fontWeight: "700" }}>
                  {copied === "link" ? "Copied ✓" : "Copy"}
                </Text>
              </Pressable>
            </View>
            <View style={{ flexDirection: "row", gap: space.sm, flexWrap: "wrap", marginTop: space.md }}>
              {channels.map((c) => (
                <GradientButton key={c.key} title={c.label} variant="ghost" onPress={() => Linking.openURL(c.url).catch(() => {})} />
              ))}
              <GradientButton title="Share" left={<Icon name="share" size={14} color={colors.onGrad} />} onPress={shareNow} />
            </View>
          </Card>

          <Card>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.ink }}>How it works</Text>
            <View style={{ gap: 6, marginTop: space.xs }}>
              {[
                "Send your code or link to a friend.",
                "They sign up and enter your code on the signup screen.",
                "You both unlock a 7-day streak shield and the \u201cMentor\u201d badge.",
                "Track your referrals from your profile."
              ].map((t, i) => (
                <Text key={i} style={{ fontSize: 14, fontWeight: "500", color: colors.ink }}>{i + 1}. {t}</Text>
              ))}
            </View>
          </Card>
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  codeBox: { marginTop: space.md, padding: space.md, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth },
  copyBtn: { marginTop: space.sm, alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: "rgba(34,211,238,0.15)", borderWidth: StyleSheet.hairlineWidth },
  linkRow: { flexDirection: "row", alignItems: "center", gap: space.sm, marginTop: space.sm, padding: 10, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth }
});
