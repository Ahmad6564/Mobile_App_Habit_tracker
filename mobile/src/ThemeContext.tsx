import React, { createContext, useContext } from "react";
import { palette as darkPalette, lightPalette, Palette } from "./theme";
import { useAppStore } from "./store/useAppStore";

const ThemeCtx = createContext<{ colors: Palette; isDark: boolean }>({ colors: darkPalette, isDark: true });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { state } = useAppStore();
  const isDark = state.settings?.theme !== "light";
  const colors = isDark ? darkPalette : (lightPalette as unknown as Palette);
  return <ThemeCtx.Provider value={{ colors, isDark }}>{children}</ThemeCtx.Provider>;
}

export function useTheme() {
  return useContext(ThemeCtx);
}
