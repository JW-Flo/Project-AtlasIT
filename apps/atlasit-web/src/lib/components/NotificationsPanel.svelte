<script lang="ts">
  import { onMount } from 'svelte';
  import type { NotificationItem, ActivityEvent } from '../api/types';
  import { listNotificationsFull, markNotificationsRead, markAllNotificationsRead } from '../api/notifications';
  import { relativeTime } from '../utils/relativeTime';
  import { createEventDispatcher } from 'svelte';
  import AccessibleDialog from './AccessibleDialog.svelte';
  import { notificationsState, setUnread } from '../stores/notifications';
  import { pushToast } from '../stores/toasts';

  export let open = false;
  export let initialItems: NotificationItem[] | null = null; // optional seed from page load

  const dispatch = createEventDispatcher<{ unread: number; activity: ActivityEvent }>();

  let items: NotificationItem[] = [];
  let loading = false;
  let error: string | null = null;
  let nextCursor: string | null = null;
  let unreadCount = 0; // mirrored from store
  let marking = false;

  async function load(reset = false) {
    if (!open) return;
    if (reset) { items = []; nextCursor = null; }
    loading = true; error = null;
    try {
      const res = await listNotificationsFull({ limit: 40, cursor: reset ? undefined : nextCursor || undefined });
      const newItems = res.items || [];
      if (reset) items = newItems; else items = [...items, ...newItems];
      nextCursor = res.nextCursor || null;
  unreadCount = res.unreadCount ?? unreadCount;
  setUnread(unreadCount);
  dispatch('unread', unreadCount); // legacy external consumer
    } catch (e: any) {
      error = e?.message || 'Failed to load notifications';
    } finally { loading = false; }
  }

  async function markSelected(ids: string[]) {
    if (!ids.length) return;
    marking = true;
    try {
  const res = await markNotificationsRead(ids);
  unreadCount = res.unreadCount;
  items = items.map(n => ids.includes(n.id) ? { ...n, read: true } : n);
  setUnread(unreadCount);
  dispatch('unread', unreadCount);
  pushToast({ id: `notif-${Date.now()}`, message: ids.length === 1 ? 'Notification marked read' : `${ids.length} notifications marked read`, kind: 'success', timeoutMs: 2500 });
    } catch (e: any) {
  error = e?.message || 'Mark read failed';
  pushToast({ id: `notif-err-${Date.now()}`, message: 'Failed to mark read', kind: 'error', timeoutMs: 4000 });
    } finally { marking = false; }
  }

  async function markAll() {
    marking = true;
    try {
  const res = await markAllNotificationsRead();
  unreadCount = res.unreadCount;
  items = items.map(n => ({ ...n, read: true }));
  setUnread(unreadCount);
  dispatch('unread', unreadCount);
  pushToast({ id: `notif-all-${Date.now()}`, message: 'All notifications marked read', kind: 'success', timeoutMs: 2500 });
    } catch (e: any) {
  error = e?.message || 'Mark all failed';
  pushToast({ id: `notif-all-err-${Date.now()}`, message: 'Failed to mark all read', kind: 'error', timeoutMs: 4000 });
    } finally { marking = false; }
  }

  onMount(() => {
    if (initialItems?.length) {
  items = initialItems;
  unreadCount = initialItems.filter(i => !i.read).length;
  setUnread(unreadCount);
    }
    if (open) load(!initialItems?.length);
  });

  $: if (open && items.length === 0 && !loading) load(true);
</script>

{#if open}
  <AccessibleDialog {open} title="Notifications" onClose={() => (open=false)} width="400px">
  <div class="panel">
    <div class="panel-head">
      <h3>Notifications {#if unreadCount>0}<span class="badge">{unreadCount}</span>{/if}</h3>
      <div class="actions">
        <button disabled={marking || unreadCount===0} on:click={markAll}>Mark All Read</button>
      </div>
    </div>
    {#if error}<div class="error">{error}</div>{/if}
    <div class="panel-body">
      {#if loading && items.length === 0}
        <div class="loading">Loading…</div>
      {:else if items.length === 0}
        <div class="empty">No notifications</div>
      {:else}
        <ul>
          {#each items as n}
            <li class="n-item {n.read ? 'read' : 'unread'}">
              <div class="top">
                <span class="kind {n.severity || ''}">{n.kind || 'info'}</span>
                <span class="time" title={n.createdAt}>{relativeTime(n.createdAt)}</span>
              </div>
              <div class="msg">{n.message}</div>
              <div class="row-actions">
                {#if !n.read}
                  <button disabled={marking} on:click={() => markSelected([n.id])}>Mark Read</button>
                {/if}
              </div>
            </li>
          {/each}
        </ul>
        {#if nextCursor}
          <button class="load-more" disabled={loading} on:click={() => load(false)}>
            {loading ? 'Loading…' : 'Load more'}
          </button>
        {/if}
      {/if}
    </div>
  </div>
  </AccessibleDialog>
{/if}

<style>
  .panel { position:fixed; top:0; right:0; width:360px; height:100%; background:#101010; color:#eee; display:flex; flex-direction:column; box-shadow:-2px 0 8px rgba(0,0,0,0.4); z-index:60; }
  .panel-head { display:flex; justify-content:space-between; align-items:center; padding:0.7rem 0.9rem; border-bottom:1px solid #222; }
  h3 { margin:0; font-size:0.95rem; }
  .badge { background:#d33; color:#fff; font-size:0.65rem; padding:2px 6px; border-radius:10px; margin-left:6px; }
  .actions button { font-size:0.65rem; padding:0.35rem 0.55rem; }
  .panel-body { flex:1; overflow-y:auto; padding:0.6rem 0.75rem 1rem; font-size:0.75rem; display:flex; flex-direction:column; gap:0.5rem; }
  ul { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:0.5rem; }
  .n-item { border:1px solid #222; background:#161616; border-radius:4px; padding:0.5rem 0.6rem; display:flex; flex-direction:column; gap:0.35rem; }
  .n-item.unread { border-color:#334155; box-shadow:0 0 0 1px #334155; }
  .n-item.read { opacity:0.7; }
  .top { display:flex; justify-content:space-between; font-size:0.6rem; color:#999; }
  .kind { text-transform:uppercase; font-weight:600; letter-spacing:0.5px; }
  .kind.critical { color:#ff4d4d; }
  .kind.high { color:#ff884d; }
  .kind.medium { color:#ffc14d; }
  .kind.low { color:#9acd32; }
  .msg { font-size:0.7rem; line-height:1.1rem; }
  button { cursor:pointer; background:#242424; color:#ddd; border:1px solid #333; padding:0.3rem 0.6rem; font-size:0.65rem; border-radius:4px; }
  button:hover:not(:disabled){ background:#2d2d2d; }
  button:disabled { opacity:0.5; cursor:default; }
  .load-more { width:100%; margin-top:0.5rem; }
  .error { padding:0.5rem 0.75rem; color:#ff6666; font-size:0.65rem; }
  .empty, .loading { padding:1rem; text-align:center; color:#777; }
  .row-actions { display:flex; justify-content:flex-end; }
</style>
