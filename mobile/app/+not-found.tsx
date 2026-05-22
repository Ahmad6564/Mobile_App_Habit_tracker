import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import ScreenBackground from "../src/components/ScreenBackground";
import Card from "../src/components/Card";
import GradientButton from "../src/components/GradientButton";
import { palette, space, typography } from "../src/theme";

export default function NotFound() {
  const router = useRouter();
  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safe}>
        <Card style={{ gap: space.md, alignItems: "center" }}>
          <Text style={typography.h1}>Page Not Found</Text>
          <Text style={[typography.muted, { textAlign: "center" }]}>The screen you are looking for does not exist.</Text>
          <GradientButton title="Back to Dashboard" onPress={() => router.replace("/(tabs)")} />
        </Card>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, padding: space.lg, justifyContent: "center" }
});
