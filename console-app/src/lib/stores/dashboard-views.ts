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

const DEFAULT_VIEW: DashboardView = {
  id: "executive",
  name: "Executive",
  widgets: [...PRESET_LAYOUTS.executive.widgets],
  preset: "executive",
};

const INITIAL_STATE: DashboardViewsState = {
  views: [
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
  ],
  activeViewId: "executive",
};

export const dashboardViews = writable<DashboardViewsState>(INITIAL_STATE);
export const dashboardViewsLoading = writable(false);

let fetched = false;

/** Load saved views from the server, merging with presets. */
export async function fetchDashboardViews(): Promise<void> {
  if (fetched) return;
  dashboardViewsLoading.set(true);
  try {
    const res = await fetch("/api/dashboard/views");
    if (!res.ok) return; // Fall back to defaults
    const data = await res.json();
    if (data.views && Array.isArray(data.views) && data.views.length > 0) {
      dashboardViews.set({
        views: data.views,
        activeViewId: data.activeViewId || data.views[0].id,
      });
    }
    fetched = true;
  } catch {
    // Use defaults on error
  } finally {
    dashboardViewsLoading.set(false);
  }
}

/** Save current views state to server. */
export async function saveDashboardViews(): Promise<boolean> {
  const state = get(dashboardViews);
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
  dashboardViews.update((s) => ({ ...s, activeViewId: id }));
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
    return { ...s, views };
  });
}

/** Delete a custom view (cannot delete last view). */
export function deleteView(id: string): void {
  dashboardViews.update((s) => {
    if (s.views.length <= 1) return s;
    const views = s.views.filter((v) => v.id !== id);
    const activeViewId = s.activeViewId === id ? views[0].id : s.activeViewId;
    return { views, activeViewId };
  });
}
