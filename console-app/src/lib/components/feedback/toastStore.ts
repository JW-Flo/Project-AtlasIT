import { writable } from "svelte/store";

export interface Toast {
  id: string;
  title?: string;
  message: string;
  variant?: "info" | "success" | "error" | "warning";
  ttl?: number; // ms
}

const { subscribe, update } = writable<Toast[]>([]);

export const toasts = { subscribe };

export function push(toast: Omit<Toast, "id">) {
  const id = crypto.randomUUID();
  const ttl = toast.ttl ?? 4000;
  update((list) => [...list, { ...toast, id, ttl }]);
  if (ttl > 0) setTimeout(() => dismiss(id), ttl);
  return id;
}

export function dismiss(id: string) {
  update((list) => list.filter((t) => t.id !== id));
}

export function clear() {
  update(() => []);
}
