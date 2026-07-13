import React, { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import ScreenBackground from "../../src/components/ScreenBackground";
import Card from "../../src/components/Card";
import GradientButton from "../../src/components/GradientButton";
import BrandMark from "../../src/components/BrandMark";
import Icon from "../../src/components/Icon";
import { useTheme } from "../../src/ThemeContext";
import { space } from "../../src/theme";
import { AuthApi, ApiError } from "../../src/lib/apiClient";
import { passwordChecks, isValidPassword } from "../../src/lib/validation";

const RULES: { key: keyof ReturnType<typeof passwordChecks>; label: string }[] = [
  { key: "length", label: "At least 8 characters" },
  { key: "upper", label: "One uppercase letter" },
  { key: "lower", label: "One lowercase letter" },
  { key: "digit", label: "One number" },
  { key: "special", label: "One special character" },
];

export default function ResetPassword() {
  const router = useRouter();
  const { colors } = useTheme();
  const { token, id } = useLocalSearchParams<{ token?: string; id?: string }>();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const checks = useMemo(() => passwordChecks(password), [password]);
  const passwordOk = isValidPassword(password);
  const matchOk = confirm.length > 0 && password === confirm;
  const linkValid = Boolean(token && id);

  async function handleSubmit() {
    setSubmitted(true);
    if (!linkValid) {
      Alert.alert("Invalid link", "This reset link is missing or malformed. Request a new one.");
      return;
    }
    if (!passwordOk || !matchOk) return;

    setLoading(true);
    try {
      await AuthApi.resetPassword(String(id), String(token), password);
      Alert.alert(
        "Password updated",
        "Your password has been reset. Please sign in with your new password.",
        [{ text: "OK", onPress: () => router.replace("/(auth)/sign-in") }]
      );
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.code === "INVALID_RESET_TOKEN"
            ? "This reset link has expired or was already used. Request a new one."
            : err.code === "NETWORK_ERROR"
            ? "Cannot reach the server. Check your connection and try again."
            : err.message
          : "Something went wrong. Please try again.";
      Alert.alert("Reset failed", msg);
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
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <SafeAreaView>
            <View style={styles.brandRow}>
              <BrandMark size={36} />
              <Text style={{ fontSize: 18, fontWeight: "700", color: colors.ink }}>HabitForge</Text>
            </View>

            <Card style={styles.card}>
              <Text style={{ fontSize: 22, fontWeight: "800", color: colors.ink }}>Reset Password</Text>
              <Text style={{ fontSize: 13, color: colors.muted, marginBottom: space.sm }}>
                Choose a new password for your account.
              </Text>

              {!linkValid && (
                <View style={[styles.warnBox, { borderColor: colors.danger, backgroundColor: `${colors.danger}14` }]}>
                  <Text style={{ fontSize: 12, color: colors.danger }}>
                    This reset link is invalid or incomplete. Open the link from your reset email, or request a new one.
                  </Text>
                </View>
              )}

              {/* New password */}
              <Text style={[styles.label, { color: colors.muted }]}>New password</Text>
              <View style={{ position: "relative" }}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="New password"
                  placeholderTextColor={colors.muted}
                  secureTextEntry={!showPwd}
                  autoCapitalize="none"
                  editable={!loading}
                  style={[inputStyle, { paddingRight: 48 }]}
                  accessibilityLabel="New password"
                />
                <Pressable onPress={() => setShowPwd((v) => !v)} style={styles.eyeBtn} hitSlop={8}>
                  <Text style={{ color: colors.muted, fontSize: 12 }}>{showPwd ? "HIDE" : "SHOW"}</Text>
                </Pressable>
              </View>

              {/* Real-time rule checklist */}
              <View style={styles.rules}>
                {RULES.map((r) => {
                  const ok = checks[r.key];
                  return (
                    <View key={r.key} style={styles.ruleRow}>
                      <Icon name={ok ? "check" : "close"} size={13} color={ok ? colors.emerald : colors.muted} />
                      <Text style={{ fontSize: 12, color: ok ? colors.ink : colors.muted }}>{r.label}</Text>
                    </View>
                  );
                })}
              </View>

              {/* Confirm password */}
              <Text style={[styles.label, { color: colors.muted }]}>Confirm password</Text>
              <TextInput
                value={confirm}
                onChangeText={setConfirm}
                placeholder="Re-enter new password"
                placeholderTextColor={colors.muted}
                secureTextEntry={!showPwd}
                autoCapitalize="none"
                editable={!loading}
                style={inputStyle}
                onSubmitEditing={handleSubmit}
                returnKeyType="done"
                accessibilityLabel="Confirm new password"
              />
              {confirm.length > 0 && !matchOk && (
                <Text style={[styles.errText, { color: colors.danger }]}>Passwords do not match</Text>
              )}
              {submitted && !passwordOk && password.length === 0 && (
                <Text style={[styles.errText, { color: colors.danger }]}>Enter a new password</Text>
              )}

              <GradientButton
                title={loading ? "Updating…" : "Update password"}
                fullWidth
                disabled={loading || !linkValid || !passwordOk || !matchOk}
                onPress={handleSubmit}
                style={[
                  { marginTop: space.md },
                  (loading || !linkValid || !passwordOk || !matchOk) && { opacity: 0.6 },
                ]}
              />
            </Card>
          </SafeAreaView>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, padding: space.lg, justifyContent: "center" },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10, justifyContent: "center", marginBottom: space.lg },
  card: { gap: 2 },
  label: { fontSize: 12, fontWeight: "600", marginTop: space.sm + 4, marginBottom: 6 },
  input: { borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, paddingVertical: 13, borderRadius: 12, fontSize: 14 },
  eyeBtn: { position: "absolute", right: 12, top: 0, bottom: 0, justifyContent: "center" },
  errText: { fontSize: 11, marginTop: 3 },
  rules: { marginTop: space.sm, gap: 4 },
  ruleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  warnBox: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 10, padding: 10, marginBottom: space.sm },
});
