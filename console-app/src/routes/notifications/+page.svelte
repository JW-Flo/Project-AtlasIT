<script lang="ts">
  import { onMount } from "svelte";
  import { push as pushToast } from "$lib/components/feedback/toastStore";
  import Card from "$lib/components/ui/card.svelte";
  import CardContent from "$lib/components/ui/card-content.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Badge from "$lib/components/ui/badge.svelte";
  import Alert from "$lib/components/ui/alert.svelte";
  import Skeleton from "$lib/components/ui/skeleton.svelte";
  import { Bell, AlertTriangle, CheckCheck, Eye } from "lucide-svelte";

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

  function kindVariant(kind: string | null): "default" | "destructive" | "warning" | "secondary" | "outline" | "success" {
    switch (kind) {
      case "incident": return "destructive";
      case "access_request": return "default";
      case "policy": return "success";
      case "workflow": return "secondary";
      default: return "outline";
    }
  }

  function severityColor(severity: string | null): string {
    switch (severity) {
      case "critical": return "text-destructive";
      case "high": return "text-warning";
      case "medium": return "text-warning";
      case "low": return "text-primary";
      default: return "text-muted-foreground";
    }
  }

  onMount(() => { load(); });
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">Notifications</h1>
      {#if unreadCount > 0}
        <p class="text-sm text-muted-foreground">{unreadCount} unread</p>
      {/if}
    </div>
    {#if items.length > 0 && unreadCount > 0}
      <Button variant="outline" size="sm" on:click={markAllRead}>
        <CheckCheck class="h-4 w-4 mr-1.5" />
        Mark All Read
      </Button>
    {/if}
  </div>

  {#if loading}
    <div class="space-y-3">
      {#each [1, 2, 3] as _}
        <Skeleton class="h-16 rounded-lg" />
      {/each}
    </div>
  {:else if error}
    <Alert variant="destructive">
      <AlertTriangle class="h-4 w-4" />
      <p class="pl-7">{error}</p>
    </Alert>
  {:else if items.length === 0}
    <Card class="border-dashed">
      <CardContent class="py-16 text-center">
        <Bell class="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
        <p class="text-sm text-muted-foreground">No notifications yet</p>
      </CardContent>
    </Card>
  {:else}
    <div class="flex flex-col gap-2">
      {#each items as notif}
        <Card class="{notif.read ? 'opacity-60' : ''} transition-opacity">
          <CardContent class="py-4 flex items-start gap-3">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1 flex-wrap">
                {#if notif.kind}
                  <Badge variant={kindVariant(notif.kind)}>
                    {notif.kind.replace("_", " ")}
                  </Badge>
                {/if}
                {#if notif.severity}
                  <span class="text-[10px] uppercase tracking-wider font-semibold {severityColor(notif.severity)}">{notif.severity}</span>
                {/if}
                <span class="text-xs text-muted-foreground ml-auto shrink-0">
                  {new Date(notif.createdAt).toLocaleString()}
                </span>
              </div>
              <p class="text-sm">{notif.message}</p>
              {#if notif.ref}
                <p class="text-xs text-muted-foreground mt-1">Ref: {notif.ref}</p>
              {/if}
            </div>
            {#if !notif.read}
              <Button variant="ghost" size="sm" on:click={() => markRead(notif.id)}>
                <Eye class="h-3.5 w-3.5 mr-1" />
                Read
              </Button>
            {/if}
          </CardContent>
        </Card>
      {/each}
    </div>
  {/if}
</div>
