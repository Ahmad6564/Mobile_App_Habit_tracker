import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Link, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import ScreenBackground from "../../src/components/ScreenBackground";
import Card from "../../src/components/Card";
import GradientButton from "../../src/components/GradientButton";
import BrandMark from "../../src/components/BrandMark";
import { useTheme } from "../../src/ThemeContext";
import { space } from "../../src/theme";

export default function SignIn() {
  const router = useRouter();
  const { colors } = useTheme();
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safe}>
        <View style={styles.brandRow}>
          <BrandMark size={36} />
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.ink }}>HabitForge</Text>
        </View>

        <Card style={styles.card}>
          <Text style={{ fontSize: 22, fontWeight: "800", color: colors.ink }}>Sign In</Text>
          <Text style={{ fontSize: 13, color: colors.muted, marginBottom: space.md }}>Welcome back.</Text>

          <Text style={[styles.label, { color: colors.ink }]}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={colors.muted}
            keyboardType="email-address"
            autoCapitalize="none"
            style={[styles.input, { backgroundColor: colors.surface2, borderColor: colors.line, color: colors.ink }]}
          />

          <Text style={[styles.label, { color: colors.ink }]}>Password</Text>
          <TextInput
            value={pwd}
            onChangeText={setPwd}
            placeholder="********"
            placeholderTextColor={colors.muted}
            secureTextEntry
            style={[styles.input, { backgroundColor: colors.surface2, borderColor: colors.line, color: colors.ink }]}
          />

          <GradientButton
            title="Continue"
            fullWidth
            onPress={() => router.replace("/(tabs)")}
            style={{ marginTop: space.md }}
          />

          <View style={styles.footerRow}>
            <Text style={{ fontSize: 13, color: colors.muted }}>New here?</Text>
            <Link href="/(auth)/sign-up" style={{ color: colors.cyan, fontWeight: "700" }}>
              Create account
            </Link>
          </View>
        </Card>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, padding: space.lg, justifyContent: "center" },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10, justifyContent: "center", marginBottom: space.lg },
  card: { gap: space.sm },
  label: { fontSize: 12, marginTop: space.sm },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 4
  },
  footerRow: { flexDirection: "row", gap: 6, justifyContent: "center", marginTop: space.md }
});
