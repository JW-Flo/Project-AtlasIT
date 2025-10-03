/**** Tailwind config for console-app ****/
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{svelte,ts}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        "card-foreground": "hsl(var(--card-foreground))",
        primary: "hsl(var(--primary))",
        "primary-foreground": "hsl(var(--primary-foreground))",
        accent: "hsl(var(--accent))",
        "accent-foreground": "hsl(var(--accent-foreground))",
        risk: {
          low: "#16a34a",
          medium: "#eab308",
          high: "#f97316",
          critical: "#dc2626",
        },
      },
      borderRadius: {
        lg: "0.65rem",
        md: "calc(0.65rem - 2px)",
        sm: "calc(0.65rem - 4px)",
      },
    },
  },
  plugins: [],
};
