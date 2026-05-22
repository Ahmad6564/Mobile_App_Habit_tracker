// Design tokens mirroring web/src/styles/global.css (dark default).
// See docs/web-frontend-walkthrough.md §0 for the source of truth.
export const palette = {
  bg0: "#0b1020",
  bg1: "#111738",
  surface: "rgba(20,26,56,0.72)",
  surfaceSolid: "#141a38",
  surface2: "rgba(255,255,255,0.04)",
  line: "rgba(255,255,255,0.08)",
  line2: "rgba(255,255,255,0.14)",
  ink: "#eaf0ff",
  muted: "#9aa3c7",
  cyan: "#22d3ee",
  violet: "#a78bfa",
  pink: "#f472b6",
  emerald: "#34d399",
  amber: "#fbbf24",
  danger: "#fb7185",
  onGrad: "#0b1020"
} as const;

export const lightPalette = {
  bg0: "#f5f7fb",
  bg1: "#e8ecf4",
  surface: "rgba(255,255,255,0.85)",
  surfaceSolid: "#ffffff",
  surface2: "rgba(0,0,0,0.03)",
  line: "rgba(0,0,0,0.08)",
  line2: "rgba(0,0,0,0.14)",
  ink: "#1a1e2e",
  muted: "#5a6380",
  cyan: "#0891b2",
  violet: "#7c3aed",
  pink: "#db2777",
  emerald: "#059669",
  amber: "#d97706",
  danger: "#e11d48",
  onGrad: "#ffffff"
} as const;

export type Palette = typeof palette;

export const gradient = ["#22d3ee", "#a78bfa", "#f472b6"] as const;
export const gradientStart = { x: 0, y: 0 };
export const gradientEnd = { x: 1, y: 1 };

export const radii = { sm: 8, md: 10, lg: 12, xl: 16, pill: 999 } as const;
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 } as const;

export const typography = {
  display: { fontSize: 28, fontWeight: "800" as const, color: palette.ink, letterSpacing: -0.5 },
  h1: { fontSize: 22, fontWeight: "800" as const, color: palette.ink },
  h2: { fontSize: 18, fontWeight: "700" as const, color: palette.ink },
  h3: { fontSize: 16, fontWeight: "700" as const, color: palette.ink },
  body: { fontSize: 14, fontWeight: "500" as const, color: palette.ink },
  muted: { fontSize: 13, color: palette.muted },
  small: { fontSize: 12, color: palette.muted },
  eyebrow: { fontSize: 11, color: palette.cyan, fontWeight: "700" as const, letterSpacing: 1.2, textTransform: "uppercase" as const }
};

export const shadow = {
  card: {
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6
  },
  glow: {
    shadowColor: palette.violet,
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8
  }
};

export const HABIT_PALETTE = [
  "#22d3ee",
  "#a78bfa",
  "#f472b6",
  "#34d399",
  "#fbbf24",
  "#fb7185",
  "#60a5fa",
  "#f59e0b",
  "#c084fc"
];
