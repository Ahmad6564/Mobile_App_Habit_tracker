import React, { useState } from "react";
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
import { Link, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import ScreenBackground from "../../src/components/ScreenBackground";
import Card from "../../src/components/Card";
import GradientButton from "../../src/components/GradientButton";
import BrandMark from "../../src/components/BrandMark";
import { useTheme } from "../../src/ThemeContext";
import { space } from "../../src/theme";
import { AuthApi, ApiError } from "../../src/lib/apiClient";

// ─── helpers ──────────────────────────────────────────────────────────────────
const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+[\]{};:'",.<>/?\\|`~]).{8,}$/;

const GENDERS = [
  { label: "Male",             value: "male" },
  { label: "Female",           value: "female" },
  { label: "Non-binary",       value: "non-binary" },
  { label: "Prefer not to say",value: "prefer-not-to-say" },
];

// ─── component ────────────────────────────────────────────────────────────────
export default function SignUp() {
  const router = useRouter();
  const { colors } = useTheme();

  const [firstName,   setFirstName]   = useState("");
  const [lastName,    setLastName]    = useState("");
  const [email,       setEmail]       = useState("");
  const [dob,         setDob]         = useState("");        // optional YYYY-MM-DD
  const [age,         setAge]         = useState("");        // required
  const [gender,      setGender]      = useState("");        // required
  const [password,    setPassword]    = useState("");
  const [showPwd,     setShowPwd]     = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [errors,      setErrors]      = useState<Record<string, string>>({});

  // ── validation ──────────────────────────────────────────────────────────────
  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!firstName.trim()) e.firstName = "First name is required";
    if (!lastName.trim())  e.lastName  = "Last name is required";
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      e.email = "Enter a valid email address";
    const ageNum = parseInt(age, 10);
    if (!age || isNaN(ageNum) || ageNum < 1 || ageNum > 120)
      e.age = "Enter a valid age (1–120)";
    if (!gender) e.gender = "Please select a gender";
    if (dob && !/^\d{4}-\d{2}-\d{2}$/.test(dob))
      e.dob = "Date of birth must be YYYY-MM-DD";
    if (!PASSWORD_RE.test(password))
      e.password =
        "Min 8 characters — must include uppercase, lowercase, digit & special character";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ── submit ──────────────────────────────────────────────────────────────────
  async function handleSignUp() {
    if (!validate()) return;
    setLoading(true);
    try {
      await AuthApi.register({
        firstName:   firstName.trim(),
        lastName:    lastName.trim(),
        email:       email.trim().toLowerCase(),
        password,
        age:         parseInt(age, 10),
        gender,
        dateOfBirth: dob.trim() || null,
        timezone:    Intl.DateTimeFormat().resolvedOptions().timeZone,
      });

      Alert.alert(
        "Check your inbox",
        `We sent a verification link to ${email.trim()}.\nThe link expires in 10 minutes.`,
        [{ text: "OK", onPress: () => router.replace("/(auth)/sign-in") }]
      );
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Something went wrong";
      Alert.alert("Sign-up failed", msg);
    } finally {
      setLoading(false);
    }
  }

  // ── render ───────────────────────────────────────────────────────────────────
  const inputStyle = [styles.input, { backgroundColor: colors.surface2, borderColor: colors.line, color: colors.ink }];
  const err = (key: string) =>
    errors[key] ? <Text style={[styles.errText, { color: "#fb7185" }]}>{errors[key]}</Text> : null;

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
              <Text style={{ fontSize: 22, fontWeight: "800", color: colors.ink }}>Create Account</Text>
              <Text style={{ fontSize: 13, color: colors.muted, marginBottom: space.sm }}>
                Start your streak today.
              </Text>

              {/* ── First name ── */}
              <Text style={[styles.label, { color: colors.ink }]}>First Name *</Text>
              <TextInput
                value={firstName} onChangeText={setFirstName}
                placeholder="John" placeholderTextColor={colors.muted}
                autoCapitalize="words" style={inputStyle}
              />
              {err("firstName")}

              {/* ── Last name ── */}
              <Text style={[styles.label, { color: colors.ink }]}>Last Name *</Text>
              <TextInput
                value={lastName} onChangeText={setLastName}
                placeholder="Doe" placeholderTextColor={colors.muted}
                autoCapitalize="words" style={inputStyle}
              />
              {err("lastName")}

              {/* ── Email ── */}
              <Text style={[styles.label, { color: colors.ink }]}>Email *</Text>
              <TextInput
                value={email} onChangeText={setEmail}
                placeholder="you@example.com" placeholderTextColor={colors.muted}
                keyboardType="email-address" autoCapitalize="none"
                style={inputStyle}
              />
              {err("email")}

              {/* ── Age ── */}
              <Text style={[styles.label, { color: colors.ink }]}>Age *</Text>
              <TextInput
                value={age} onChangeText={setAge}
                placeholder="25" placeholderTextColor={colors.muted}
                keyboardType="number-pad" style={inputStyle}
              />
              {err("age")}

              {/* ── Gender ── */}
              <Text style={[styles.label, { color: colors.ink }]}>Gender *</Text>
              <View style={styles.genderRow}>
                {GENDERS.map((g) => (
                  <Pressable
                    key={g.value}
                    onPress={() => setGender(g.value)}
                    style={[
                      styles.genderChip,
                      {
                        borderColor: gender === g.value ? colors.cyan : colors.line,
                        backgroundColor:
                          gender === g.value ? `${colors.cyan}22` : colors.surface2,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        color: gender === g.value ? colors.cyan : colors.muted,
                        fontWeight: gender === g.value ? "700" : "400",
                      }}
                    >
                      {g.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {err("gender")}

              {/* ── Date of birth (optional) ── */}
              <Text style={[styles.label, { color: colors.ink }]}>
                Date of Birth{" "}
                <Text style={{ color: colors.muted, fontSize: 11 }}>(optional, YYYY-MM-DD)</Text>
              </Text>
              <TextInput
                value={dob} onChangeText={setDob}
                placeholder="1999-06-15" placeholderTextColor={colors.muted}
                style={inputStyle}
              />
              {err("dob")}

              {/* ── Password ── */}
              <Text style={[styles.label, { color: colors.ink }]}>Password *</Text>
              <View style={{ position: "relative" }}>
                <TextInput
                  value={password} onChangeText={setPassword}
                  placeholder="Min 8 chars, A-z, 0-9, symbol"
                  placeholderTextColor={colors.muted}
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
              {err("password")}

              {/* ── Submit ── */}
              <GradientButton
                title={loading ? "Creating account…" : "Get Started"}
                fullWidth
                onPress={handleSignUp}
                style={{ marginTop: space.md }}
              />

              <View style={styles.footerRow}>
                <Text style={{ fontSize: 13, color: colors.muted }}>Already have an account?</Text>
                <Link href="/(auth)/sign-in" style={{ color: colors.cyan, fontWeight: "700" }}>
                  Sign in
                </Link>
              </View>
            </Card>
          </SafeAreaView>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  scroll:     { flexGrow: 1, padding: space.lg, paddingBottom: 40 },
  brandRow:   { flexDirection: "row", alignItems: "center", gap: 10, justifyContent: "center", marginBottom: space.lg },
  card:       { gap: 2 },
  label:      { fontSize: 12, fontWeight: "600", marginTop: space.sm, marginBottom: 4 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
  },
  errText:    { fontSize: 11, marginTop: 3 },
  genderRow:  { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  genderChip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  footerRow:  { flexDirection: "row", gap: 6, justifyContent: "center", marginTop: space.md },
  eyeBtn:     { position: "absolute", right: 12, top: 0, bottom: 0, justifyContent: "center" },
});
