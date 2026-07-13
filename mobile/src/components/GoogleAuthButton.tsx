import React, { useState } from "react";
import { ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import GradientButton from "./GradientButton";
import { useTheme } from "../ThemeContext";
import { useGoogleSignIn, isGoogleConfigured } from "../lib/googleAuth";
import { AuthApi, ApiError } from "../lib/apiClient";

function friendlyError(err: ApiError): string {
  switch (err.code) {
    case "BANNED":
      return "This account has been banned.";
    case "SUSPENDED":
      return "This account is suspended. Please try again later.";
    case "UNAUTHORIZED":
      return "Google sign-in could not be verified. Please try again.";
    case "NETWORK_ERROR":
      return "Cannot reach the server. Check your connection and try again.";
    case "BAD_REQUEST":
      return err.message; // e.g. "Google Sign-In is not configured…"
    default:
      return err.message || "Google sign-in failed. Please try again.";
  }
}

type Props = { label?: string };

export default function GoogleAuthButton(props: Props) {
  // Calling useGoogleSignIn without the platform's client ID crashes the screen
  // (expo throws a synchronous invariant). Skip rendering the hook-bearing inner
  // component entirely when Google isn't configured.
  if (!isGoogleConfigured()) return null;
  return <GoogleAuthButtonInner {...props} />;
}

function GoogleAuthButtonInner({ label = "Continue with Google" }: Props) {
  const router = useRouter();
  const { colors } = useTheme();
  const [busy, setBusy] = useState(false);

  const handleToken = async (idToken: string) => {
    setBusy(true);
    try {
      // AuthApi.googleLogin persists the tokens to AsyncStorage on success.
      await AuthApi.googleLogin(idToken);
      router.replace("/(tabs)");
    } catch (err) {
      setBusy(false);
      const msg = err instanceof ApiError ? friendlyError(err) : "Google sign-in failed. Please try again.";
      Alert.alert("Google Sign-In", msg);
    }
  };

  const { promptAsync, ready } = useGoogleSignIn({
    onToken: handleToken,
    onError: (m) => {
      setBusy(false);
      Alert.alert("Google Sign-In", m);
    },
    onCancel: () => setBusy(false),
  });

  const onPress = async () => {
    if (!ready || busy) return;
    setBusy(true);
    try {
      await promptAsync();
      // On success the response effect calls onToken (keeps busy → navigates).
      // On cancel/error the respective handler clears busy.
    } catch {
      setBusy(false);
      Alert.alert("Google Sign-In", "Could not start Google sign-in. Please try again.");
    }
  };

  const disabled = !ready || busy;

  return (
    <GradientButton
      title={busy ? "Signing in…" : label}
      variant="ghost"
      fullWidth
      accessibilityLabel="Continue with Google"
      accessibilityState={{ disabled, busy }}
      disabled={disabled}
      onPress={onPress}
      style={disabled ? { opacity: 0.6 } : undefined}
      left={
        busy ? (
          <ActivityIndicator size="small" color={colors.ink} />
        ) : (
          <Ionicons name="logo-google" size={16} color={colors.ink} />
        )
      }
    />
  );
}
