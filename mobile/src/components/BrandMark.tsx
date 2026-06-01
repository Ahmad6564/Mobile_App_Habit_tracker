import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { gradient, gradientEnd, gradientStart, palette, radii } from "../theme";

export default function BrandMark({ size = 36 }: { size?: number }) {
  const fontSize = Math.round(size * 0.42);
  return (
    <LinearGradient
      colors={gradient}
      start={gradientStart}
      end={gradientEnd}
      style={[styles.mark, { width: size, height: size, borderRadius: Math.round(size * 0.28) }]}
    >
      <Text style={[styles.text, { fontSize }]}>HF</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  mark: { alignItems: "center", justifyContent: "center" },
  text: { color: palette.onGrad, fontWeight: "900", letterSpacing: 0.5 }
});
