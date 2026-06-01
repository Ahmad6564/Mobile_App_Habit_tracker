import React from "react";
import { Pressable, PressableProps, StyleSheet, Text, View, ViewStyle, StyleProp } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { gradient, gradientEnd, gradientStart, radii, space } from "../theme";
import { useTheme } from "../ThemeContext";

type Variant = "primary" | "ghost" | "danger";
type Size = "md" | "sm";

type Props = Omit<PressableProps, "style"> & {
  title?: string;
  children?: React.ReactNode;
  variant?: Variant;
  size?: Size;
  left?: React.ReactNode;
  right?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  fullWidth?: boolean;
};

export default function GradientButton({
  title,
  children,
  variant = "primary",
  size = "md",
  left,
  right,
  style,
  fullWidth,
  ...rest
}: Props) {
  const { colors } = useTheme();
  const pad = size === "sm" ? { paddingVertical: 8, paddingHorizontal: 12 } : { paddingVertical: 12, paddingHorizontal: 16 };
  const fontSize = size === "sm" ? 13 : 14;

  const content = (
    <View style={[styles.row, { gap: 6 }]}>
      {left}
      {title ? (
        <Text style={[styles.text, { fontSize, color: variant === "primary" ? colors.onGrad : colors.ink }]}>
          {title}
        </Text>
      ) : null}
      {children}
      {right}
    </View>
  );

  if (variant === "primary") {
    return (
      <Pressable
        {...rest}
        style={({ pressed }) => [
          styles.base,
          fullWidth && { width: "100%" },
          { borderRadius: radii.md, overflow: "hidden", opacity: pressed ? 0.9 : 1 },
          style
        ]}
      >
        <LinearGradient colors={gradient} start={gradientStart} end={gradientEnd} style={[styles.fill, pad]}>
          {content}
        </LinearGradient>
      </Pressable>
    );
  }

  const bg = variant === "danger" ? "rgba(251,113,133,0.12)" : colors.surface2;
  const borderColor = variant === "danger" ? "rgba(251,113,133,0.45)" : colors.line2;
  return (
    <Pressable
      {...rest}
      style={({ pressed }) => [
        styles.base,
        fullWidth && { width: "100%" },
        {
          backgroundColor: bg,
          borderColor,
          borderWidth: StyleSheet.hairlineWidth,
          borderRadius: radii.md,
          opacity: pressed ? 0.85 : 1
        },
        pad,
        style
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignSelf: "flex-start" },
  fill: { alignItems: "center", justifyContent: "center" },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  text: { fontWeight: "700" }
});
