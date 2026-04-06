import { writable, derived } from "svelte/store";

export type DateRangePreset = "7" | "30" | "90" | "365";

export interface DashboardContext {
  /** Date range in days. */
  dateRange: DateRangePreset;
  /** Framework filter — null means "all frameworks". */
  frameworkFilter: string | null;
}

export const dashboardContext = writable<DashboardContext>({
  dateRange: "30",
  frameworkFilter: null,
});

/** Derived: ISO date string for the start of the selected range. */
export const sinceDate = derived(dashboardContext, ($ctx) => {
  const days = parseInt($ctx.dateRange, 10);
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
});

export function setDateRange(range: DateRangePreset) {
  dashboardContext.update((ctx) => ({ ...ctx, dateRange: range }));
}

export function setFrameworkFilter(framework: string | null) {
  dashboardContext.update((ctx) => ({ ...ctx, frameworkFilter: framework }));
}
