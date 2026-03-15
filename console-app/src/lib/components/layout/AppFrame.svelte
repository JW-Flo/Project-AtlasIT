<script lang="ts">
  import Button from "../primitives/Button.svelte";
  import { theme, setTheme } from "../../stores/theme";
  import { onMount, afterUpdate } from "svelte";
  import { page } from "$app/stores";
  import { init as initUx } from "../../instrumentation/ux-metrics";
  import ToastContainer from "../feedback/ToastContainer.svelte";
  import { push as pushToast } from "../feedback/toastStore";

  import { getRuntimeConfig } from "../../config";
  import { fetchSession } from "../../stores/session";
  interface NavItem {
    href: string;
    label: string;
  }

  const navItems: NavItem[] = [
    { href: "/console", label: "Dashboard" },
    { href: "/console/policies", label: "Policy Generator" },
    { href: "/console/compliance", label: "Compliance" },
    { href: "/console/marketplace", label: "Marketplace" },
    { href: "/console/integrations", label: "API Manager" },
    { href: "/console/workflows", label: "Workflows" },
    { href: "/access-requests", label: "Access Requests" },
    { href: "/incidents", label: "Incidents" },
    { href: "/console/directory", label: "Directory" },
    { href: "/console/platform-status", label: "Platform Status" },
  ];
  export let nav: NavItem[] = navItems;

  let userRoles: string[] = [];
  let isImpersonating = false;
  let impersonatedBy = "";

  $: computedNav = [
    ...nav,
    { href: "/console/settings", label: "Settings" },
    ...(userRoles.includes("super-admin") ? [{ href: "/console/admin", label: "Admin" }] : []),
  ];

  async function exitImpersonation() {
    await fetch("/api/admin/impersonate/exit", { method: "POST" });
    location.href = "/console/admin";
  }

  let resolvedBase: string | null = null;
  let complianceBase: string | null = null;
  let usingFallback = false;

  // Reactive current path from SvelteKit page store
  $: current = $page.url.pathname;

  function ensureBase(base: string | null | undefined) {
    if (!base) return "";
    return base.replace(/\/$/, "");
  }

  // Check if a nav item is active — exact match for Dashboard, prefix for others
  function isActive(href: string, pathname: string): boolean {
    if (href === "/console") return pathname === "/console" || pathname === "/console/";
    return pathname.startsWith(href);
  }

  onMount(async () => {
    initUx();
    try {
      const cfg = await getRuntimeConfig();
      complianceBase = cfg.complianceBase;
      resolvedBase = cfg.resolvedBase || null;
      usingFallback = Boolean(
        cfg.resolvedBase && cfg.resolvedBase !== cfg.complianceBase
      );
    } catch {
      // silent fallback
    }

    try {
      const sessionData = await fetchSession();
      if (sessionData) {
        userRoles = sessionData.roles || [];
        isImpersonating = sessionData.impersonating || false;
        impersonatedBy = sessionData.impersonatedBy || "";
      }
    } catch {
      // silent fallback
    }
  });
  let unreadCount = 0;

  onMount(async () => {
    try {
      const res = await fetch("/api/notifications?unread=true");
      if (res.ok) {
        const data = await res.json();
        unreadCount = data.unreadCount || 0;
      }
    } catch {
      unreadCount = 0;
    }
  });

  let t: "light" | "dark" = "dark";
  const unsub = theme.subscribe((v) => (t = v));
  function toggleTheme() {
    setTheme(t === "dark" ? "light" : "dark");
  }
  onMount(() => () => unsub());
</script>

<div class="app-frame">
  <a href="#main" class="skip-link">Skip to content</a>
  <aside class="sidebar">
    <div class="logo">AtlasIT</div>
    {#if isImpersonating}
      <div class="impersonation-banner">
        <span>Viewing as tenant</span>
        <button on:click={exitImpersonation}>Exit</button>
      </div>
    {/if}
    <nav>
      {#each computedNav as item}
        <a href={item.href} class:item-active={isActive(item.href, current)}
          >{item.label}</a
        >
      {/each}
    </nav>
    <div class="endpoint-note">
      {#if usingFallback && resolvedBase}
        <span class="badge badge-warning" title={`Primary ${complianceBase}`}
          >Fallback: {resolvedBase}</span
        >
      {:else if complianceBase}
        <span class="badge">Primary: {complianceBase}</span>
      {/if}
    </div>
    <div class="grow"></div>
    <div class="bell-area">
      <a href="/notifications" class="bell-button" title="Notifications" aria-label="Notifications">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"/>
        </svg>
        {#if unreadCount > 0}
          <span class="bell-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        {/if}
      </a>
    </div>
    <div class="actions">
      <Button
        size="sm"
        variant="subtle"
        ariaLabel="Toggle theme"
        on:click={toggleTheme}
        >{t === "dark" ? "Light" : "Dark"}</Button
      >
      <Button
        size="sm"
        variant="outline"
        ariaLabel="Sign out"
        on:click={async () => {
          await fetch("/api/auth/logout", { method: "POST" });
          location.href = "/console/login";
        }}
        >Sign Out</Button
      >
    </div>
  </aside>
  <main class="main" id="main">
    <slot />
    <ToastContainer />
  </main>
</div>

<style>
  .app-frame {
    display: flex;
    min-height: 100dvh;
    background: var(--color-bg);
    color: var(--color-text);
  }
  .sidebar {
    width: 200px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px 14px;
    background: var(--color-surface-alt);
    border-right: 1px solid var(--color-border);
  }
  .logo {
    font-weight: 600;
    font-size: 18px;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
  }
  .sidebar nav {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .sidebar a {
    text-decoration: none;
    font-size: 13px;
    padding: 6px 10px;
    border-radius: 6px;
    color: var(--color-text-dim);
    transition:
      background 0.18s ease,
      color 0.18s ease;
  }
  .sidebar a:hover {
    background: var(--color-surface);
    color: var(--color-text);
  }
  .sidebar a.item-active {
    background: var(--color-accent);
    color: #fff;
  }
  .endpoint-note {
    font-size: 11px;
    color: var(--color-text-dim);
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 8px;
  }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    border-radius: 999px;
    background: rgba(59, 130, 246, 0.12);
    color: #93c5fd;
    border: 1px solid rgba(59, 130, 246, 0.4);
  }
  .impersonation-banner {
    background: #dc2626;
    color: white;
    padding: 6px 10px;
    border-radius: 6px;
    font-size: 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .impersonation-banner button {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    padding: 2px 8px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 11px;
  }
  .impersonation-banner button:hover {
    background: rgba(255, 255, 255, 0.35);
  }
  .badge-warning {
    background: rgba(251, 191, 36, 0.16);
    color: #fcd34d;
    border-color: rgba(251, 191, 36, 0.4);
  }
  .main {
    flex: 1;
    min-width: 0;
  }
  .skip-link {
    position: absolute;
    left: -999px;
    top: 0;
    background: var(--color-accent);
    color: #fff;
    padding: 6px 10px;
    border-radius: 6px;
    z-index: 100;
  }
  .skip-link:focus {
    left: 10px;
    box-shadow: 0 0 0 3px var(--color-focus);
  }
  .grow {
    flex: 1;
  }
  .bell-area { display: flex; justify-content: center; margin-bottom: 8px; }
  .bell-button { position: relative; padding: 6px; border-radius: 8px; color: var(--color-text-dim); transition: background 0.18s, color 0.18s; text-decoration: none; display: inline-flex; }
  .bell-button:hover { background: var(--color-surface); color: var(--color-text); }
  .bell-badge { position: absolute; top: 0; right: 0; min-width: 16px; height: 16px; padding: 0 4px; border-radius: 999px; background: #ef4444; color: white; font-size: 10px; font-weight: 700; display: flex; align-items: center; justify-content: center; line-height: 1; }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  @media (max-width: 860px) {
    .sidebar {
      position: fixed;
      inset: 0 auto 0 0;
      transform: translateX(0);
      width: 170px;
    }
    .main {
      margin-left: 170px;
    }
  }
</style>
