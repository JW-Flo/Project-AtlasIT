// Design tokens (initial scaffold). Semantic-first mapping to core primitives.
// Extend rather than mutate to preserve stability.

export const palette = {
  blue: {
    50: "#e3f2ff",
    100: "#b9e0ff",
    200: "#8dcbff",
    300: "#5fb2ff",
    400: "#379bff",
    500: "#0d82ff",
    600: "#0066d6",
    700: "#004ea5",
    800: "#003671",
    900: "#002244",
  },
  gray: {
    50: "#f5f7fa",
    100: "#e9edf2",
    200: "#d4dbe3",
    300: "#b5c0cc",
    400: "#8d99a6",
    500: "#677280",
    600: "#4d5560",
    700: "#363c44",
    800: "#23272d",
    900: "#14171a",
  },
  red: { 400: "#f87171", 500: "#ef4444", 600: "#dc2626" },
  yellow: { 400: "#facc15", 500: "#eab308" },
  green: { 400: "#4ade80", 500: "#22c55e", 600: "#16a34a" },
};

export const semantic = {
  color: {
    bg: "var(--color-bg)",
    surface: "var(--color-surface)",
    surfaceAlt: "var(--color-surface-alt)",
    border: "var(--color-border)",
    text: "var(--color-text)",
    textDim: "var(--color-text-dim)",
    accent: "var(--color-accent)",
    accentHover: "var(--color-accent-hover)",
    critical: "var(--color-critical)",
    warning: "var(--color-warning)",
    success: "var(--color-success)",
    focus: "var(--color-focus)",
  },
  radius: {
    xs: "2px",
    sm: "4px",
    md: "6px",
    lg: "10px",
    pill: "999px",
  },
  space: {
    0: "0",
    1: "2px",
    2: "4px",
    3: "8px",
    4: "12px",
    5: "16px",
    6: "20px",
    7: "24px",
    8: "32px",
  },
  shadow: {
    sm: "0 1px 2px rgba(0,0,0,0.15)",
    md: "0 3px 8px rgba(0,0,0,0.22)",
    focus: "0 0 0 3px var(--color-focus)",
  },
  font: {
    family: "Inter, system-ui, sans-serif",
    size: {
      xs: "11px",
      sm: "12px",
      base: "14px",
      md: "16px",
      lg: "20px",
      xl: "24px",
      xxl: "32px",
    },
    weight: { regular: 400, medium: 500, semibold: 600, bold: 700 },
  },
  motion: {
    fast: "120ms",
    normal: "180ms",
    slow: "280ms",
    easing: "cubic-bezier(.4,0,.2,1)",
  },
};

export const darkThemeVars = {
  "--color-bg": palette.gray[900],
  "--color-surface": palette.gray[800],
  "--color-surface-alt": palette.gray[700],
  "--color-border": palette.gray[600],
  "--color-text": "#f5f7fa",
  "--color-text-dim": "#b5c0cc",
  "--color-accent": palette.blue[500],
  "--color-accent-hover": palette.blue[400],
  "--color-critical": palette.red[500],
  "--color-warning": palette.yellow[500],
  "--color-success": palette.green[500],
  "--color-focus": palette.blue[300],
};

export const lightThemeVars = {
  "--color-bg": "#ffffff",
  "--color-surface": palette.gray[50],
  "--color-surface-alt": palette.gray[100],
  "--color-border": palette.gray[300],
  "--color-text": palette.gray[900],
  "--color-text-dim": palette.gray[500],
  "--color-accent": palette.blue[600],
  "--color-accent-hover": palette.blue[500],
  "--color-critical": palette.red[500],
  "--color-warning": palette.yellow[500],
  "--color-success": palette.green[600],
  "--color-focus": palette.blue[300],
};

export function applyTheme(vars: Record<string, string>) {
  const root = document.documentElement;
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
}
