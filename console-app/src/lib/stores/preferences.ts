import { writable } from "svelte/store";

export interface UserPreferences {
  showHelpIcons: boolean;
}

export const preferences = writable<UserPreferences>({
  showHelpIcons: true,
});

let fetched = false;

export async function fetchPreferences(): Promise<UserPreferences | null> {
  if (fetched) {
    let current: UserPreferences | null = null;
    preferences.subscribe((v) => (current = v))();
    return current;
  }

  try {
    const res = await fetch("/api/user/preferences");
    if (!res.ok) {
      // Default to showing help icons if fetch fails
      return { showHelpIcons: true };
    }
    const data = await res.json();
    const prefs: UserPreferences = {
      showHelpIcons: data.showHelpIcons ?? true,
    };
    preferences.set(prefs);
    fetched = true;
    return prefs;
  } catch {
    return { showHelpIcons: true };
  }
}

export async function updatePreference(key: keyof UserPreferences, value: boolean): Promise<void> {
  try {
    const res = await fetch("/api/user/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: value }),
    });
    if (res.ok) {
      preferences.update((p) => ({ ...p, [key]: value }));
    }
  } catch (err) {
    console.error("Failed to update preference:", err);
  }
}
