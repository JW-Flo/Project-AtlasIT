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
    { href: "/console/apps", label: "Apps" },
    { href: "/console/workflows", label: "Workflows" },
    { href: "/access-requests", label: "Access Requests" },
    { href: "/incidents", label: "Incidents" },
    { href: "/console/directory", label: "Directory" },
    { href: "/console/platform-status", label: "Platform Status" },
  ];
  export let nav: NavItem[] = navItems;

  let userRoles: string[] = [];
  let userEmail = "";
  let userDisplayName = "";
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

  $: current = $page.url.pathname;

  function ensureBase(base: string | null | undefined) {
    if (!base) return "";
    return base.replace(/\/$/, "");
  }

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
        userEmail = sessionData.email || "";
        userDisplayName = sessionData.displayName || sessionData.email || "";
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

  // Profile dropdown
  let profileOpen = false;

  function handleClickOutside(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (!target.closest(".profile-dropdown-container")) {
      profileOpen = false;
    }
  }

  $: initials = userDisplayName
    ? userDisplayName.split(/[\s@]/).filter(Boolean).slice(0, 2).map((s) => s[0].toUpperCase()).join("")
    : "?";

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    location.href = "/console/login";
  }
</script>

<svelte:window on:click={handleClickOutside} />

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
  </aside>
  <div class="main-wrapper">
    <!-- Top bar -->
    <header class="topbar">
      <div class="topbar-spacer"></div>
      <div class="topbar-actions">
        <!-- Notifications -->
        <a href="/notifications" class="topbar-icon-btn" title="Notifications" aria-label="Notifications">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"/>
          </svg>
          {#if unreadCount > 0}
            <span class="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
          {/if}
        </a>

        <!-- Theme toggle -->
        <button class="topbar-icon-btn" on:click={toggleTheme} title="Toggle theme" aria-label="Toggle theme">
          {#if t === "dark"}
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"/>
            </svg>
          {:else}
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"/>
            </svg>
          {/if}
        </button>

        <!-- Profile dropdown -->
        <div class="profile-dropdown-container">
          <button
            class="profile-btn"
            on:click|stopPropagation={() => profileOpen = !profileOpen}
            aria-label="User menu"
            aria-expanded={profileOpen}
          >
            <span class="avatar">{initials}</span>
          </button>

          {#if profileOpen}
            <div class="profile-dropdown">
              <div class="profile-info">
                <span class="avatar avatar-lg">{initials}</span>
                <div class="profile-details">
                  <div class="profile-name">{userDisplayName}</div>
                  {#if userEmail && userEmail !== userDisplayName}
                    <div class="profile-email">{userEmail}</div>
                  {/if}
                </div>
              </div>
              <div class="dropdown-divider"></div>
              <a href="/console/settings" class="dropdown-item" on:click={() => profileOpen = false}>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                Settings
              </a>
              <button class="dropdown-item" on:click={signOut}>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3-3l3-3m0 0l-3-3m3 3H9"/></svg>
                Sign Out
              </button>
            </div>
          {/if}
        </div>
      </div>
    </header>
    <main class="main" id="main">
      <slot />
      <ToastContainer />
    </main>
  </div>
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

  /* Main wrapper with topbar */
  .main-wrapper {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 52px;
    padding: 0 20px;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-surface-alt);
    flex-shrink: 0;
  }
  .topbar-spacer { flex: 1; }
  .topbar-actions {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .topbar-icon-btn {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    border: none;
    background: transparent;
    color: var(--color-text-dim);
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
    text-decoration: none;
  }
  .topbar-icon-btn:hover {
    background: var(--color-surface);
    color: var(--color-text);
  }
  .notif-badge {
    position: absolute;
    top: 4px;
    right: 4px;
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    border-radius: 999px;
    background: #ef4444;
    color: white;
    font-size: 10px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
  }

  /* Profile dropdown */
  .profile-dropdown-container {
    position: relative;
    margin-left: 4px;
  }
  .profile-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px;
    border: none;
    background: transparent;
    cursor: pointer;
    border-radius: 8px;
    transition: background 0.15s;
  }
  .profile-btn:hover {
    background: var(--color-surface);
  }
  .avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--color-accent);
    color: #fff;
    font-size: 12px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .avatar-lg {
    width: 40px;
    height: 40px;
    font-size: 14px;
  }
  .profile-dropdown {
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    width: 260px;
    border-radius: 10px;
    background: var(--color-surface-alt);
    border: 1px solid var(--color-border);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    z-index: 100;
    overflow: hidden;
  }
  .profile-info {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 14px 12px;
  }
  .profile-details {
    min-width: 0;
  }
  .profile-name {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .profile-email {
    font-size: 11px;
    color: var(--color-text-dim);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .dropdown-divider {
    height: 1px;
    background: var(--color-border);
  }
  .dropdown-item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 10px 14px;
    border: none;
    background: transparent;
    color: var(--color-text-dim);
    font-size: 13px;
    cursor: pointer;
    text-decoration: none;
    transition: background 0.12s, color 0.12s;
    text-align: left;
  }
  .dropdown-item:hover {
    background: var(--color-surface);
    color: var(--color-text);
  }

  .main {
    flex: 1;
    min-width: 0;
    overflow-y: auto;
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
  @media (max-width: 860px) {
    .sidebar {
      position: fixed;
      inset: 0 auto 0 0;
      transform: translateX(0);
      width: 170px;
    }
    .main-wrapper {
      margin-left: 170px;
    }
  }
</style>
