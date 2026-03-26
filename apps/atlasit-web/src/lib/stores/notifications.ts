import { writable } from "svelte/store";

// Global notifications unread count + items cache (lightweight)
export interface NotificationsState {
  unread: number;
}

const initial: NotificationsState = { unread: 0 };

export const notificationsState = writable<NotificationsState>(initial);

export function setUnread(count: number) {
  notificationsState.update((s) => ({ ...s, unread: count < 0 ? 0 : count }));
}
