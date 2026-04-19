import { writable, get } from "svelte/store";

export interface TourState {
  active: boolean;
  currentStep: number;
  completed: boolean;
}

const TOUR_KEY = "atlasit_demo_tour";

function loadState(): TourState {
  if (typeof sessionStorage === "undefined")
    return { active: false, currentStep: 0, completed: false };
  try {
    const stored = sessionStorage.getItem(TOUR_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { active: false, currentStep: 0, completed: false };
}

function persist(state: TourState) {
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.setItem(TOUR_KEY, JSON.stringify(state));
  }
}

export const tourState = writable<TourState>(loadState());

tourState.subscribe(persist);

export function startTour() {
  tourState.set({ active: true, currentStep: 0, completed: false });
}

export function nextStep() {
  tourState.update((s) => ({ ...s, currentStep: s.currentStep + 1 }));
}

export function prevStep() {
  tourState.update((s) => ({ ...s, currentStep: Math.max(0, s.currentStep - 1) }));
}

export function skipTour() {
  tourState.update((s) => ({ ...s, active: false, completed: true }));
}

export function goToStep(index: number) {
  tourState.update((s) => ({ ...s, currentStep: index }));
}

export function getTourState(): TourState {
  return get(tourState);
}
