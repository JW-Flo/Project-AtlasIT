<script lang="ts">
  import Button from "../primitives/Button.svelte";
  import { theme, setTheme } from "../../stores/theme";
  import { onMount, afterUpdate } from "svelte";
  import { page } from "$app/stores";
  import { init as initUx } from "../../instrumentation/ux-metrics";
  import ToastContainer from "../feedback/ToastContainer.svelte";
  import { push as pushToast } from "../feedback/toastStore";

  import { getRuntimeConfig } from "../../config";
  interface NavItem {
    href: string;
    label: string;
  }

  const navItems: NavItem[] = [
    { href: "/console", label: "Dashboard" },
    { href: "/console/policies", label: "Policy Generator" },
    { href: "/console/marketplace", label: "Marketplace" },
    { href: "/access-requests", label: "Access Requests" },
    { href: "/incidents", label: "Incidents" },
    { href: "/notifications", label: "Notifications" },
    { href: "/console/platform-status", label: "Platform Status" },
  ];
  export let nav: NavItem[] = navItems;

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
    <nav>
      {#each nav as item}
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
