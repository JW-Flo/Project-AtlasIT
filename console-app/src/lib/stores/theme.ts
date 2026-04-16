import { writable } from "svelte/store";
import { applyTheme, darkThemeVars, lightThemeVars } from "../design/tokens";

type Theme = "light" | "dark";
const KEY = "atlasit.theme";

function detect(): Theme {
  const stored =
    typeof localStorage !== "undefined" ? (localStorage.getItem(KEY) as Theme | null) : null;
  if (stored === "light" || stored === "dark") return stored;
  if (typeof matchMedia !== "undefined" && matchMedia("(prefers-color-scheme: dark)").matches)
    return "dark";
  return "dark"; // default dark aesthetic
}

export const theme = writable<Theme>(detect());

// Gate DB writes until after first server sync (avoids unauthenticated PATCHes on page load)
let dbWriteEnabled = false;

function applyLocal(t: Theme) {
  theme.set(t);
  if (typeof localStorage !== "undefined") localStorage.setItem(KEY, t);
  if (typeof document !== "undefined") {
    document.documentElement.dataset.theme = t;
    document.documentElement.classList.toggle("dark", t === "dark");
    applyTheme(t === "dark" ? darkThemeVars : lightThemeVars);
  }
}

export function setTheme(t: Theme) {
  applyLocal(t);
  // Persist to DB (fire-and-forget, only after server sync has run)
  if (dbWriteEnabled && typeof fetch !== "undefined") {
    fetch("/api/user/preferences", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ theme: t }),
    }).catch(() => {});
  }
}

export async function syncThemeFromServer(): Promise<void> {
  try {
    const res = await fetch("/api/user/preferences");
    if (res.ok) {
      const prefs = await res.json();
      if (prefs.theme === "light" || prefs.theme === "dark") {
        applyLocal(prefs.theme);
      }
    }
  } catch {}
  dbWriteEnabled = true;
}

if (typeof document !== "undefined") {
  // initialize on load from localStorage (no DB write)
  applyLocal(detect());
}
