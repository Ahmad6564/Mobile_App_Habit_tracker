import React from "react";
import { StyleSheet, View, ViewProps } from "react-native";
import { palette, radii, shadow, space } from "../theme";
import { useTheme } from "../ThemeContext";

type Props = ViewProps & { padded?: boolean };

export default function Card({ children, style, padded = true, ...rest }: Props) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }, padded && styles.padded, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.xl,
    ...shadow.card
  },
  padded: { padding: space.lg }
});
