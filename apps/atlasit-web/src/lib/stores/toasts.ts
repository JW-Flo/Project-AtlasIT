import { writable } from "svelte/store";

export interface Toast {
  id: string;
  message: string;
  variant?: "info" | "success" | "error" | "warn";
  timeout?: number; // ms
  dismissible?: boolean;
}

function createStore() {
  const { subscribe, update, set } = writable<Toast[]>([]);

  function push(t: Omit<Toast, "id">) {
    const toast: Toast = {
      id: crypto.randomUUID(),
      variant: "info",
      timeout: 4000,
      dismissible: true,
      ...t,
    };
    update((list) => [...list, toast]);
    if (toast.timeout && toast.timeout > 0) {
      setTimeout(() => dismiss(toast.id), toast.timeout);
    }
    return toast.id;
  }

  function dismiss(id: string) {
    update((list) => list.filter((t) => t.id !== id));
  }

  function clear() {
    set([]);
  }

  return { subscribe, push, dismiss, clear };
}

export const toasts = createStore();

// helper shortcuts
export const toast = {
  info: (m: string, opts: Partial<Toast> = {}) =>
    toasts.push({ message: m, variant: "info", ...opts }),
  success: (m: string, opts: Partial<Toast> = {}) =>
    toasts.push({ message: m, variant: "success", ...opts }),
  error: (m: string, opts: Partial<Toast> = {}) =>
    toasts.push({ message: m, variant: "error", ...opts }),
  warn: (m: string, opts: Partial<Toast> = {}) =>
    toasts.push({ message: m, variant: "warn", ...opts }),
};
