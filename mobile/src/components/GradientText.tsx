import React from "react";
import { Text, TextProps } from "react-native";

/**
 * Simplified "gradient" text — uses brand violet so we don't pull in
 * @react-native-masked-view/masked-view as a dependency. The cyan→violet→pink
 * accent appears in BrandMark, primary buttons and badges instead.
 */
export default function GradientText({ children, style, ...rest }: TextProps) {
  return <Text {...rest} style={[{ color: "#c4b5fd" }, style]}>{children}</Text>;
}
