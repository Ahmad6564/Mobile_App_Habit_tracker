import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
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
import Icon from "../../src/components/Icon";
import { useTheme } from "../../src/ThemeContext";
import { space } from "../../src/theme";
import { AuthApi, ApiError } from "../../src/lib/apiClient";
import { isValidEmail } from "../../src/lib/validation";

export default function ForgotPassword() {
  const router = useRouter();
  const { colors } = useTheme();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    if (!isValidEmail(email)) {
      setError("Enter a valid email address");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await AuthApi.forgotPassword(email.trim().toLowerCase());
      // Backend always returns a generic success — never reveal if the email exists.
      setSent(true);
    } catch (err) {
      // Only surface transport failures; a normal response is always "success".
      setError(
        err instanceof ApiError && err.code === "NETWORK_ERROR"
          ? "Cannot reach the server. Check your connection and try again."
          : "Something went wrong. Please try again."
      );
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
            {sent ? (
              <View style={{ gap: space.sm }}>
                <View style={[styles.successIcon, { backgroundColor: `${colors.emerald}22` }]}>
                  <Icon name="check" size={28} color={colors.emerald} />
                </View>
                <Text style={{ fontSize: 22, fontWeight: "800", color: colors.ink }}>Check your email</Text>
                <Text style={{ fontSize: 13, color: colors.muted, lineHeight: 20 }}>
                  If an account exists for{" "}
                  <Text style={{ color: colors.ink, fontWeight: "700" }}>{email.trim().toLowerCase()}</Text>,
                  we've sent a password reset link. It expires in 1 hour and can be used once.
                </Text>
                <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
                  Open the email on this device and tap the button to reset your password in the app.
                </Text>
                <GradientButton
                  title="Back to Sign In"
                  fullWidth
                  onPress={() => router.replace("/(auth)/sign-in")}
                  style={{ marginTop: space.md }}
                />
              </View>
            ) : (
              <>
                <Text style={{ fontSize: 22, fontWeight: "800", color: colors.ink }}>Forgot Password</Text>
                <Text style={{ fontSize: 13, color: colors.muted, marginBottom: space.md }}>
                  Enter your email and we'll send you a reset link.
                </Text>

                <Text style={[styles.label, { color: colors.muted }]}>Email</Text>
                <TextInput
                  value={email}
                  onChangeText={(v) => {
                    setEmail(v);
                    if (error) setError(null);
                  }}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.muted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  editable={!loading}
                  style={inputStyle}
                  onSubmitEditing={handleSubmit}
                  returnKeyType="send"
                  accessibilityLabel="Email address"
                />
                {error && <Text style={[styles.errText, { color: colors.danger }]}>{error}</Text>}

                <GradientButton
                  title={loading ? "Sending…" : "Send reset link"}
                  fullWidth
                  disabled={loading}
                  onPress={handleSubmit}
                  style={[{ marginTop: space.md }, loading && { opacity: 0.7 }]}
                />

                <View style={styles.footerRow}>
                  <Text style={{ fontSize: 13, color: colors.muted }}>Remembered it?</Text>
                  <Link href="/(auth)/sign-in" style={{ color: colors.cyan, fontWeight: "700" }}>
                    Sign in
                  </Link>
                </View>
              </>
            )}
          </Card>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, padding: space.lg, justifyContent: "center" },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10, justifyContent: "center", marginBottom: space.lg },
  card: { gap: 2 },
  label: { fontSize: 12, fontWeight: "600", marginTop: space.sm + 4, marginBottom: 6 },
  input: { borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, paddingVertical: 13, borderRadius: 12, fontSize: 14 },
  errText: { fontSize: 11, marginTop: 3 },
  footerRow: { flexDirection: "row", gap: 6, justifyContent: "center", marginTop: space.md },
  successIcon: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", marginBottom: 4 },
});
