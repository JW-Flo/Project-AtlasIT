import { writable } from "svelte/store";
import { applyTheme, darkThemeVars, lightThemeVars } from "../design/tokens";

type Theme = "light" | "dark";
const KEY = "atlasit.theme";

function detect(): Theme {
  const stored =
    typeof localStorage !== "undefined"
      ? (localStorage.getItem(KEY) as Theme | null)
      : null;
  if (stored === "light" || stored === "dark") return stored;
  if (
    typeof matchMedia !== "undefined" &&
    matchMedia("(prefers-color-scheme: dark)").matches
  )
    return "dark";
  return "dark"; // default dark aesthetic
}

export const theme = writable<Theme>(detect());

export function setTheme(t: Theme) {
  theme.set(t);
  if (typeof localStorage !== "undefined") localStorage.setItem(KEY, t);
  if (typeof document !== "undefined") {
    document.documentElement.dataset.theme = t;
    applyTheme(t === "dark" ? darkThemeVars : lightThemeVars);
  }
}

if (typeof document !== "undefined") {
  // initialize on load
  setTheme(detect());
}
