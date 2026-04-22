import { ac as head, aj as attr_class, al as attr, ao as ensure_array_like, an as escape_html } from './renderer-CwxN8JkH.js';
import '@sveltejs/kit/internal';
import './root-okDAyOJ_.js';
import '@sveltejs/kit/internal/server';
import './state.svelte-C5vp5qlO.js';
import { B as Button } from './button-BXPyX210.js';
import { C as Card } from './card-1P6BfRcm.js';
import { B as Badge } from './badge-CdvwjGCK.js';
import { P as Page_header } from './page-header-BaRCucb6.js';
import { E as Empty_state } from './empty-state-BGCoXdYN.js';
import { E as ErrorBoundary, s as safeFetch, r as relativeTime } from './time-D6hT3Ioh.js';
import { p as push } from './toastStore-X6rW096m.js';
import { R as Refresh_cw } from './refresh-cw-Bn83BloP.js';
import { S as Search } from './search-BqxOHk0I.js';
import { C as Circle_alert } from './circle-alert-CWX8Vrvc.js';
import { U as Users } from './users-B6QpDkaK.js';
import './utils2-BgZmMgq3.js';
import './index-server-C1ubzO3x.js';
import './stores-emli2svW.js';
import './triangle-alert-BIxAVWgG.js';
import './Icon-DQFqITWq.js';
import './index-C1X1AO8K.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let filteredUsers;
    let users = [];
    let groups = [];
    let syncStatus = null;
    let loadingUsers = true;
    let loadingGroups = true;
    let loadingStatus = true;
    let errorUsers = null;
    let errorGroups = null;
    let searchQuery = "";
    let refreshing = false;
    function lastSynced() {
      if (!syncStatus?.connections?.length) return "never";
      const dates = syncStatus.connections.filter((c) => c.lastSyncAt).map((c) => new Date(c.lastSyncAt).getTime());
      if (!dates.length) return "never";
      return relativeTime(new Date(Math.max(...dates)).toISOString());
    }
    async function loadUsers() {
      loadingUsers = true;
      errorUsers = null;
      try {
        const res = await safeFetch("/api/v1/directory/users", { context: "load directory users", retry: true });
        if (res.ok) {
          const result = res.data;
          users = result?.data?.items ?? [];
        } else {
          errorUsers = res.error.actionable;
          push({
            variant: "error",
            title: "Failed to load users",
            message: res.error.actionable
          });
        }
      } catch (e) {
        errorUsers = "Failed to load users. Please try again.";
      } finally {
        loadingUsers = false;
      }
    }
    async function loadGroups() {
      loadingGroups = true;
      errorGroups = null;
      try {
        const res = await safeFetch("/api/v1/directory/groups", { context: "load directory groups", retry: true });
        if (res.ok) {
          const result = res.data;
          groups = result?.data?.items ?? [];
        } else {
          errorGroups = res.error.actionable;
          push({
            variant: "error",
            title: "Failed to load groups",
            message: res.error.actionable
          });
        }
      } catch (e) {
        errorGroups = "Failed to load groups. Please try again.";
      } finally {
        loadingGroups = false;
      }
    }
    async function loadSyncStatus() {
      loadingStatus = true;
      try {
        const res = await safeFetch("/api/v1/directory/sync/status", { context: "load sync status" });
        if (res.ok) {
          const result = res.data;
          const d = result?.data;
          if (d) {
            syncStatus = {
              userCount: Number(d.userCount ?? d.user_count ?? 0),
              groupCount: Number(d.groupCount ?? d.group_count ?? 0),
              connections: Array.isArray(d.connections) ? d.connections.map((c) => ({ lastSyncAt: String(c.lastSyncAt ?? c.last_sync_at ?? "") })) : []
            };
          }
        }
      } catch {
      } finally {
        loadingStatus = false;
      }
    }
    async function refresh() {
      refreshing = true;
      await Promise.all([loadUsers(), loadGroups(), loadSyncStatus()]);
      refreshing = false;
    }
    filteredUsers = searchQuery.trim() ? users.filter((u) => {
      const q = searchQuery.toLowerCase();
      return u.email.toLowerCase().includes(q) || (u.display_name ?? "").toLowerCase().includes(q) || (u.department ?? "").toLowerCase().includes(q) || (u.title ?? "").toLowerCase().includes(q);
    }) : users;
    searchQuery.trim() ? groups.filter((g) => {
      const q = searchQuery.toLowerCase();
      return g.name.toLowerCase().includes(q) || (g.description ?? "").toLowerCase().includes(q);
    }) : groups;
    head("1jwqevg", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Directory · AtlasIT</title>`);
      });
    });
    ErrorBoundary($$renderer2, {
      onRetry: refresh,
      children: ($$renderer3) => {
        $$renderer3.push(`<div class="animate-fade-in" data-tour="directory-users">`);
        Page_header($$renderer3, {
          title: "Directory",
          description: !loadingStatus && syncStatus ? `${syncStatus.userCount} users · ${syncStatus.groupCount} groups · last synced ${lastSynced()}` : "Loading directory…",
          $$slots: {
            actions: ($$renderer4) => {
              {
                Button($$renderer4, {
                  variant: "outline",
                  size: "sm",
                  disabled: refreshing,
                  children: ($$renderer5) => {
                    Refresh_cw($$renderer5, {
                      class: "h-3.5 w-3.5 " + (refreshing ? "animate-spin" : ""),
                      strokeWidth: 2.25
                    });
                    $$renderer5.push(`<!----> Refresh`);
                  },
                  $$slots: { default: true }
                });
              }
            }
          }
        });
        $$renderer3.push(`<!----> <div class="flex items-center justify-between flex-wrap gap-3 mb-5 border-b border-border"><div class="flex gap-1 -mb-px"><button${attr_class("px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors border-primary text-primary")}>Users `);
        if (!loadingUsers) {
          $$renderer3.push("<!--[0-->");
          Badge($$renderer3, {
            variant: "muted",
            size: "sm",
            class: "ml-1.5",
            children: ($$renderer4) => {
              $$renderer4.push(`<!---->${escape_html(users.length)}`);
            },
            $$slots: { default: true }
          });
        } else {
          $$renderer3.push("<!--[-1-->");
        }
        $$renderer3.push(`<!--]--></button> <button${attr_class("px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors border-transparent text-muted-foreground hover:text-foreground")}>Groups `);
        if (!loadingGroups) {
          $$renderer3.push("<!--[0-->");
          Badge($$renderer3, {
            variant: "muted",
            size: "sm",
            class: "ml-1.5",
            children: ($$renderer4) => {
              $$renderer4.push(`<!---->${escape_html(groups.length)}`);
            },
            $$slots: { default: true }
          });
        } else {
          $$renderer3.push("<!--[-1-->");
        }
        $$renderer3.push(`<!--]--></button></div> <div class="relative max-w-xs flex-1 min-w-[200px] mb-2">`);
        Search($$renderer3, {
          class: "absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground",
          strokeWidth: 2.25
        });
        $$renderer3.push(`<!----> <input type="text"${attr("value", searchQuery)}${attr("placeholder", "Search users…")} class="w-full h-9 pl-8 pr-3 text-sm rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground/60 transition-colors focus:outline-none focus:border-primary focus:shadow-ring-primary"/></div></div> `);
        {
          $$renderer3.push("<!--[0-->");
          if (loadingUsers) {
            $$renderer3.push("<!--[0-->");
            Card($$renderer3, {
              padding: "none",
              class: "overflow-hidden",
              children: ($$renderer4) => {
                $$renderer4.push(`<div class="divide-y divide-border"><!--[-->`);
                const each_array = ensure_array_like(Array(6));
                for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
                  each_array[$$index];
                  $$renderer4.push(`<div class="px-5 py-3 flex gap-4"><div class="h-4 w-48 skeleton"></div> <div class="h-4 w-32 skeleton"></div> <div class="h-4 w-24 skeleton"></div></div>`);
                }
                $$renderer4.push(`<!--]--></div>`);
              },
              $$slots: { default: true }
            });
          } else if (errorUsers) {
            $$renderer3.push("<!--[1-->");
            Card($$renderer3, {
              padding: "md",
              class: "bg-destructive-muted border-destructive/20",
              children: ($$renderer4) => {
                $$renderer4.push(`<div class="flex items-start gap-3">`);
                Circle_alert($$renderer4, {
                  class: "h-5 w-5 text-destructive shrink-0 mt-0.5",
                  strokeWidth: 2
                });
                $$renderer4.push(`<!----> <div class="flex-1"><p class="text-sm text-destructive font-medium">Failed to load users: ${escape_html(errorUsers)}</p> `);
                Button($$renderer4, {
                  variant: "destructive",
                  size: "sm",
                  class: "mt-3",
                  children: ($$renderer5) => {
                    $$renderer5.push(`<!---->Retry`);
                  },
                  $$slots: { default: true }
                });
                $$renderer4.push(`<!----></div></div>`);
              },
              $$slots: { default: true }
            });
          } else if (filteredUsers.length === 0) {
            $$renderer3.push("<!--[2-->");
            Card($$renderer3, {
              padding: "lg",
              children: ($$renderer4) => {
                Empty_state($$renderer4, {
                  title: "No users in directory",
                  description: "Connect a directory provider to sync users.",
                  icon: Users
                });
              },
              $$slots: { default: true }
            });
          } else {
            $$renderer3.push("<!--[-1-->");
            Card($$renderer3, {
              padding: "none",
              class: "overflow-hidden",
              children: ($$renderer4) => {
                $$renderer4.push(`<div class="overflow-x-auto mobile-table-wrapper"><table class="min-w-full text-sm"><thead><tr class="bg-muted/40 border-b border-border"><th class="px-5 py-2.5 text-left text-2xs font-semibold text-muted-foreground uppercase tracking-wider">Email</th><th class="px-5 py-2.5 text-left text-2xs font-semibold text-muted-foreground uppercase tracking-wider">Name</th><th class="px-5 py-2.5 text-left text-2xs font-semibold text-muted-foreground uppercase tracking-wider">Department</th><th class="px-5 py-2.5 text-left text-2xs font-semibold text-muted-foreground uppercase tracking-wider">Title</th><th class="px-5 py-2.5 text-left text-2xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th><th class="px-5 py-2.5 text-right text-2xs font-semibold text-muted-foreground uppercase tracking-wider">Joined</th></tr></thead><tbody class="divide-y divide-border"><!--[-->`);
                const each_array_1 = ensure_array_like(filteredUsers);
                for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
                  let user = each_array_1[$$index_1];
                  $$renderer4.push(`<tr class="row-hover cursor-pointer hover:bg-muted/30 focus:bg-muted/30 focus:outline-none" role="link" tabindex="0"><td class="px-5 py-2.5 text-sm font-medium text-foreground">${escape_html(user.email)}</td><td class="px-5 py-2.5 text-sm text-foreground/80">${escape_html(user.display_name ?? "—")}</td><td class="px-5 py-2.5 text-xs text-muted-foreground">${escape_html(user.department ?? "—")}</td><td class="px-5 py-2.5 text-xs text-muted-foreground">${escape_html(user.title ?? "—")}</td><td class="px-5 py-2.5">`);
                  Badge($$renderer4, {
                    variant: user.status === "active" ? "success" : user.status === "suspended" ? "warning" : "muted",
                    size: "sm",
                    dot: true,
                    children: ($$renderer5) => {
                      $$renderer5.push(`<!---->${escape_html(user.status)}`);
                    },
                    $$slots: { default: true }
                  });
                  $$renderer4.push(`<!----></td><td class="px-5 py-2.5 text-xs text-muted-foreground tabular-nums text-right">${escape_html(relativeTime(user.created_at))}</td></tr>`);
                }
                $$renderer4.push(`<!--]--></tbody></table></div>`);
              },
              $$slots: { default: true }
            });
          }
          $$renderer3.push(`<!--]-->`);
        }
        $$renderer3.push(`<!--]--> `);
        {
          $$renderer3.push("<!--[-1-->");
        }
        $$renderer3.push(`<!--]--></div>`);
      },
      $$slots: { default: true }
    });
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-sGmCchdQ.js.map
