import { writable, get } from "svelte/store";
import type { WidgetId, PresetLayoutId } from "$lib/components/widgets";
import { PRESET_LAYOUTS } from "$lib/components/widgets";

/** A named dashboard view. */
export interface DashboardView {
  id: string;
  name: string;
  widgets: WidgetId[];
  /** If based on a preset, track which one. */
  preset?: PresetLayoutId;
}

export interface DashboardViewsState {
  views: DashboardView[];
  activeViewId: string;
}

const LS_KEY = "atlasit:dashboard-views";

const DEFAULT_VIEW: DashboardView = {
  id: "executive",
  name: "Executive",
  widgets: [...PRESET_LAYOUTS.executive.widgets],
  preset: "executive",
};

const PRESET_VIEWS: DashboardView[] = [
  DEFAULT_VIEW,
  {
    id: "operations",
    name: "Operations",
    widgets: [...PRESET_LAYOUTS.operations.widgets],
    preset: "operations",
  },
  {
    id: "evidence",
    name: "Evidence",
    widgets: [...PRESET_LAYOUTS.evidence.widgets],
    preset: "evidence",
  },
];

/** Restore from localStorage for instant view recovery on page refresh. */
function loadFromLocalStorage(): DashboardViewsState {
  const fallback: DashboardViewsState = {
    views: PRESET_VIEWS,
    activeViewId: "executive",
  };
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (parsed?.views && Array.isArray(parsed.views) && parsed.activeViewId) {
      return parsed;
    }
  } catch {
    // corrupt data — fall back
  }
  return fallback;
}

function saveToLocalStorage(state: DashboardViewsState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch {
    // quota exceeded — non-critical
  }
}

export const dashboardViews = writable<DashboardViewsState>(loadFromLocalStorage());
export const dashboardViewsLoading = writable(false);

let fetched = false;

/** Load saved views from the server, merging with presets. */
export async function fetchDashboardViews(): Promise<void> {
  if (fetched) return;
  dashboardViewsLoading.set(true);
  try {
    const res = await fetch("/api/dashboard/views");
    if (!res.ok) return; // Fall back to local/defaults
    const data = await res.json();
    if (data.views && Array.isArray(data.views) && data.views.length > 0) {
      const state: DashboardViewsState = {
        views: data.views,
        activeViewId: data.activeViewId || data.views[0].id,
      };
      dashboardViews.set(state);
      saveToLocalStorage(state);
    }
    fetched = true;
  } catch {
    // Use local/defaults on error
  } finally {
    dashboardViewsLoading.set(false);
  }
}

/** Save current views state to server + localStorage. */
export async function saveDashboardViews(): Promise<boolean> {
  const state = get(dashboardViews);
  saveToLocalStorage(state);
  try {
    const res = await fetch("/api/dashboard/views", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(state),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Get the currently active view. */
export function getActiveView(): DashboardView {
  const state = get(dashboardViews);
  return state.views.find((v) => v.id === state.activeViewId) || state.views[0] || DEFAULT_VIEW;
}

/** Switch to a view by ID. */
export function setActiveView(id: string): void {
  dashboardViews.update((s) => {
    const next = { ...s, activeViewId: id };
    saveToLocalStorage(next);
    return next;
  });
}

/** Create or update a custom view. */
export function upsertView(view: DashboardView): void {
  dashboardViews.update((s) => {
    const idx = s.views.findIndex((v) => v.id === view.id);
    const views = [...s.views];
    if (idx >= 0) {
      views[idx] = view;
    } else {
      views.push(view);
    }
    const next = { ...s, views };
    saveToLocalStorage(next);
    return next;
  });
}

/** Delete a custom view (cannot delete last view). */
export function deleteView(id: string): void {
  dashboardViews.update((s) => {
    if (s.views.length <= 1) return s;
    const views = s.views.filter((v) => v.id !== id);
    const activeViewId = s.activeViewId === id ? views[0].id : s.activeViewId;
    const next = { views, activeViewId };
    saveToLocalStorage(next);
    return next;
  });
}
