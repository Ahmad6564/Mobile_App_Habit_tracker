import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import ScreenBackground from "../../src/components/ScreenBackground";
import Card from "../../src/components/Card";
import GradientButton from "../../src/components/GradientButton";
import BrandMark from "../../src/components/BrandMark";
import GoogleAuthButton from "../../src/components/GoogleAuthButton";
import { useTheme } from "../../src/ThemeContext";
import { space } from "../../src/theme";
import { AuthApi, ApiError } from "../../src/lib/apiClient";

export default function SignIn() {
  const router = useRouter();
  const { colors } = useTheme();

  const [email,   setEmail]   = useState("");
  const [pwd,     setPwd]     = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState<{ email?: string; password?: string }>({});

  // ── validation ──────────────────────────────────────────────────────────────
  function validate(): boolean {
    const e: { email?: string; password?: string } = {};
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      e.email = "Enter a valid email address";
    if (!pwd) e.password = "Password is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ── submit ──────────────────────────────────────────────────────────────────
  async function handleSignIn() {
    if (!validate()) return;
    setLoading(true);
    try {
      await AuthApi.login(email.trim().toLowerCase(), pwd);
      router.replace("/(tabs)");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.statusCode === 403 && err.code === "UNVERIFIED") {
          Alert.alert(
            "Email not verified",
            "Please check your inbox. Would you like us to resend the verification link?",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Resend",
                onPress: async () => {
                  try {
                    await AuthApi.resendVerification(email.trim().toLowerCase());
                    Alert.alert("Sent", "A new verification link has been sent (expires in 10 minutes).");
                  } catch {
                    Alert.alert("Error", "Could not resend verification email.");
                  }
                },
              },
            ]
          );
        } else {
          Alert.alert("Sign-in failed", err.message);
        }
      } else {
        Alert.alert("Sign-in failed", "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = [
    styles.input,
    { backgroundColor: colors.surface2, borderColor: colors.line, color: colors.ink },
  ];

  return (
    <ScreenBackground>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <SafeAreaView style={styles.safe}>
          <View style={styles.brandRow}>
            <BrandMark size={36} />
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.ink }}>HabitForge</Text>
          </View>

          <Card style={styles.card}>
            <Text style={{ fontSize: 22, fontWeight: "800", color: colors.ink }}>Sign In</Text>
            <Text style={{ fontSize: 13, color: colors.muted, marginBottom: space.md }}>
              Welcome back.
            </Text>

            {/* ── Email ── */}
            <Text style={[styles.label, { color: colors.muted }]}>Email</Text>
            <TextInput
              value={email} onChangeText={setEmail}
              placeholder="you@example.com" placeholderTextColor={colors.muted}
              keyboardType="email-address" autoCapitalize="none"
              style={inputStyle}
            />
            {errors.email && (
              <Text style={[styles.errText, { color: "#fb7185" }]}>{errors.email}</Text>
            )}

            {/* ── Password ── */}
            <Text style={[styles.label, { color: colors.muted }]}>Password</Text>
            <View style={{ position: "relative" }}>
              <TextInput
                value={pwd} onChangeText={setPwd}
                placeholder="Your password" placeholderTextColor={colors.muted}
                secureTextEntry={!showPwd}
                style={[inputStyle, { paddingRight: 48 }]}
              />
              <Pressable
                onPress={() => setShowPwd((v) => !v)}
                style={styles.eyeBtn}
                hitSlop={8}
              >
                <Text style={{ color: colors.muted, fontSize: 12 }}>
                  {showPwd ? "HIDE" : "SHOW"}
                </Text>
              </Pressable>
            </View>
            {errors.password && (
              <Text style={[styles.errText, { color: "#fb7185" }]}>{errors.password}</Text>
            )}

            {/* ── Forgot password ── */}
            <Pressable
              onPress={() => router.push("/(auth)/forgot-password" as any)}
              style={{ alignSelf: "flex-end", marginTop: 6 }}
            >
              <Text style={{ fontSize: 12, color: colors.cyan }}>Forgot password?</Text>
            </Pressable>

            {/* ── Submit ── */}
            <GradientButton
              title={loading ? "Signing in…" : "Continue"}
              fullWidth
              disabled={loading}
              onPress={handleSignIn}
              style={[{ marginTop: space.md }, loading && { opacity: 0.7 }]}
            />

            {/* ── or divider ── */}
            <View style={styles.dividerRow}>
              <View style={[styles.divider, { backgroundColor: colors.line }]} />
              <Text style={{ fontSize: 12, color: colors.muted }}>or</Text>
              <View style={[styles.divider, { backgroundColor: colors.line }]} />
            </View>

            <GoogleAuthButton />

            <View style={styles.footerRow}>
              <Text style={{ fontSize: 13, color: colors.muted }}>New here?</Text>
              <Link href="/(auth)/sign-up" style={{ color: colors.cyan, fontWeight: "700" }}>
                Create account
              </Link>
            </View>
          </Card>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safe:     { flex: 1, padding: space.lg, justifyContent: "center" },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10, justifyContent: "center", marginBottom: space.lg },
  card:     { gap: 2 },
  label:    { fontSize: 12, fontWeight: "600", marginTop: space.sm + 4, marginBottom: 6, color: undefined },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 12,
    fontSize: 14,
  },
  errText:   { fontSize: 11, marginTop: 3 },
  footerRow: { flexDirection: "row", gap: 6, justifyContent: "center", marginTop: space.md },
  eyeBtn:    { position: "absolute", right: 12, top: 0, bottom: 0, justifyContent: "center" },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: space.md },
  divider:   { flex: 1, height: StyleSheet.hairlineWidth },
});
