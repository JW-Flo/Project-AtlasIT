import type {
  NotificationsListResponse,
  NotificationsMarkReadResponse,
  NotificationItem,
} from "./types";
import { listNotifications as coreList } from "./client";

// Direct fetch wrappers for specialized endpoints not exposed in generic client map.
async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function listNotificationsFull(
  params: { limit?: number; cursor?: string } = {},
): Promise<NotificationsListResponse> {
  const base = await coreList(params.limit || 40);
  return base;
}

export async function markNotificationsRead(
  ids: string[],
): Promise<NotificationsMarkReadResponse> {
  if (!ids.length)
    return {
      updated: [],
      unreadCount: (await listNotificationsFull({ limit: 1 })).unreadCount,
    };
  return postJson<NotificationsMarkReadResponse>("/api/v1/notifications/read", {
    ids,
  });
}

export async function markAllNotificationsRead(): Promise<NotificationsMarkReadResponse> {
  return postJson<NotificationsMarkReadResponse>(
    "/api/v1/notifications/read-all",
    {},
  );
}
