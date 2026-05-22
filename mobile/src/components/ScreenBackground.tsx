import React from "react";
import { StyleSheet, View, ViewProps } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { palette } from "../theme";
import { useTheme } from "../ThemeContext";

/**
 * Full-screen background that mirrors the web app:
 *  - dark base #0b1020 → #111738 vertical gradient
 *  - 3 soft radial glows (cyan top-left, violet top-right, pink bottom)
 */
export default function ScreenBackground({ children, style, ...rest }: ViewProps) {
  const { colors, isDark } = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: colors.bg0 }, style]} {...rest}>
      <LinearGradient
        colors={[colors.bg0, colors.bg1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {isDark && (
        <>
          {/* Cyan glow top-left */}
          <View pointerEvents="none" style={[styles.blob, { top: -180, left: -120 }]}>
            <LinearGradient
              colors={["rgba(34,211,238,0.35)", "rgba(34,211,238,0)"]}
              style={styles.blobFill}
              start={{ x: 0.5, y: 0.5 }}
              end={{ x: 1, y: 1 }}
            />
          </View>
          {/* Violet glow top-right */}
          <View pointerEvents="none" style={[styles.blob, { top: -140, right: -120 }]}>
            <LinearGradient
              colors={["rgba(167,139,250,0.32)", "rgba(167,139,250,0)"]}
              style={styles.blobFill}
              start={{ x: 0.5, y: 0.5 }}
              end={{ x: 0, y: 1 }}
            />
          </View>
          {/* Pink glow bottom-center */}
          <View pointerEvents="none" style={[styles.blob, { bottom: -200, alignSelf: "center" }]}>
            <LinearGradient
              colors={["rgba(244,114,182,0.25)", "rgba(244,114,182,0)"]}
              style={styles.blobFill}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            />
          </View>
        </>
      )}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg0 },
  content: { flex: 1 },
  blob: {
    position: "absolute",
    width: 460,
    height: 460,
    borderRadius: 230,
    overflow: "hidden"
  },
  blobFill: { flex: 1, borderRadius: 230 }
});
