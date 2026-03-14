<script lang="ts">
  import { push as pushToast } from "$lib/components/feedback/toastStore";

  interface NotificationRecord {
    id: number;
    kind: string | null;
    severity: string | null;
    message: string;
    ref: string | null;
    read: boolean;
    createdAt: string;
    readAt: string | null;
  }

  let items: NotificationRecord[] = [];
  let loading = true;
  let error: string | null = null;
  let unreadCount = 0;

  async function load() {
    loading = true;
    error = null;
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      const data = await res.json();
      items = data.items || [];
      unreadCount = data.unreadCount ?? items.filter((n: NotificationRecord) => !n.read).length;
    } catch (e: any) {
      error = e?.message || "Failed to load notifications";
    } finally {
      loading = false;
    }
  }

  async function markRead(id: number) {
    try {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id] }),
      });
      items = items.map((n) =>
        n.id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n
      );
      unreadCount = Math.max(0, unreadCount - 1);
    } catch {
      pushToast({ message: "Failed to mark as read", variant: "error" });
    }
  }

  async function markAllRead() {
    try {
      await fetch("/api/notifications/read-all", { method: "POST" });
      items = items.map((n) => ({
        ...n,
        read: true,
        readAt: n.readAt || new Date().toISOString(),
      }));
      unreadCount = 0;
      pushToast({ message: "All notifications marked as read", variant: "success" });
    } catch {
      pushToast({ message: "Failed to mark all as read", variant: "error" });
    }
  }

  function severityColor(severity: string | null): string {
    switch (severity) {
      case "critical":
        return "text-red-400";
      case "high":
        return "text-orange-400";
      case "medium":
        return "text-yellow-400";
      case "low":
        return "text-blue-400";
      default:
        return "text-white/60";
    }
  }

  function kindBadge(kind: string | null): string {
    switch (kind) {
      case "incident":
        return "bg-red-600/20 text-red-300 border-red-500/30";
      case "access_request":
        return "bg-blue-600/20 text-blue-300 border-blue-500/30";
      case "policy":
        return "bg-green-600/20 text-green-300 border-green-500/30";
      case "workflow":
        return "bg-purple-600/20 text-purple-300 border-purple-500/30";
      default:
        return "bg-neutral-600/20 text-neutral-300 border-neutral-500/30";
    }
  }

  load();
</script>

<div class="p-6 max-w-5xl mx-auto flex flex-col gap-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-semibold">Notifications</h1>
      {#if unreadCount > 0}
        <p class="text-sm text-white/60">{unreadCount} unread</p>
      {/if}
    </div>
    {#if items.length > 0 && unreadCount > 0}
      <button
        class="text-sm bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded text-white"
        on:click={markAllRead}
      >
        Mark All Read
      </button>
    {/if}
  </div>

  {#if loading}
    <div class="text-sm text-neutral-400">Loading...</div>
  {:else if error}
    <div class="text-sm text-red-400 bg-red-900/20 rounded-lg p-4">{error}</div>
  {:else if items.length === 0}
    <div class="flex flex-col items-center justify-center py-16 text-white/30 gap-3">
      <svg class="w-16 h-16 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      <p class="text-sm">No notifications yet</p>
    </div>
  {:else}
    <div class="flex flex-col gap-2">
      {#each items as notif}
        <div
          class="bg-[#1a2332] rounded-lg p-4 flex items-start gap-3 border {notif.read
            ? 'border-white/5 opacity-60'
            : 'border-white/10'}"
        >
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              {#if notif.kind}
                <span
                  class="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border {kindBadge(notif.kind)}"
                >
                  {notif.kind.replace("_", " ")}
                </span>
              {/if}
              {#if notif.severity}
                <span class="text-xs {severityColor(notif.severity)}">{notif.severity}</span>
              {/if}
              <span class="text-xs text-white/30 ml-auto">
                {new Date(notif.createdAt).toLocaleString()}
              </span>
            </div>
            <p class="text-sm text-white/85">{notif.message}</p>
            {#if notif.ref}
              <p class="text-xs text-white/40 mt-1">Ref: {notif.ref}</p>
            {/if}
          </div>
          {#if !notif.read}
            <button
              class="text-xs bg-neutral-700 hover:bg-neutral-600 px-2 py-1 rounded text-white/70 shrink-0"
              on:click={() => markRead(notif.id)}
            >
              Mark Read
            </button>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>
