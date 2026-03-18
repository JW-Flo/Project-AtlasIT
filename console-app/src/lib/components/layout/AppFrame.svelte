<script lang="ts">
  import { cn } from "$lib/utils";
  import { theme, setTheme, syncThemeFromServer } from "../../stores/theme";
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { init as initUx } from "../../instrumentation/ux-metrics";
  import ToastContainer from "../feedback/ToastContainer.svelte";
  import Avatar from "../ui/avatar.svelte";
  import Separator from "../ui/separator.svelte";
  import { getRuntimeConfig } from "../../config";
  import { fetchSession } from "../../stores/session";
  import {
    LayoutDashboard,
    Shield,
    Users,
    User,
    Store,
    AppWindow,
    Workflow,
    KeyRound,
    AlertTriangle,
    FolderCog,
    Settings,
    ShieldCheck,
    Bell,
    Sun,
    Moon,
    LogOut,
    ChevronDown,
    Activity,
    FileText,
    Zap,
  } from "lucide-svelte";

  interface NavSection {
    title: string;
    items: NavItem[];
  }

  interface NavItem {
    href: string;
    label: string;
    icon: any;
  }

  let userRoles: string[] = [];
  let userEmail = "";
  let userDisplayName = "";
  let isImpersonating = false;
  let impersonatedBy = "";

  const navSections: NavSection[] = [
    {
      title: "Main",
      items: [
        { href: "/console", label: "Dashboard", icon: LayoutDashboard },
        { href: "/console/compliance", label: "Compliance", icon: ShieldCheck },
        { href: "/console/compliance/feed", label: "Evidence Feed", icon: Activity },
        { href: "/console/directory", label: "Directory", icon: Users },
      ],
    },
    {
      title: "Integrations",
      items: [
        { href: "/console/marketplace", label: "Marketplace", icon: Store },
        { href: "/console/apps", label: "Apps", icon: AppWindow },
        { href: "/console/workflows", label: "Workflows", icon: Workflow },
        { href: "/console/automation", label: "Automation", icon: Zap },
      ],
    },
    {
      title: "Operations",
      items: [
        { href: "/access-requests", label: "Access Requests", icon: KeyRound },
        { href: "/console/automation/runs", label: "Automation Runs", icon: Workflow },
        { href: "/console/jml/changelog", label: "JML Changelog", icon: FileText },
        { href: "/incidents", label: "Incidents", icon: AlertTriangle },
        { href: "/console/policies", label: "Policy Generator", icon: FileText },
      ],
    },
    {
      title: "System",
      items: [
        { href: "/console/platform-status", label: "Platform Status", icon: Activity },
        { href: "/console/settings", label: "Settings", icon: Settings },
      ],
    },
  ];

  $: computedSections = userRoles.includes("super-admin")
    ? [...navSections.slice(0, -1), {
        ...navSections[navSections.length - 1],
        items: [
          ...navSections[navSections.length - 1].items,
          { href: "/console/admin", label: "Admin", icon: Shield },
        ],
      }]
    : navSections;

  async function exitImpersonation() {
    await fetch("/api/admin/impersonate/exit", { method: "POST" });
    location.href = "/console/admin";
  }

  $: current = $page.url.pathname;

  function isActive(href: string, pathname: string): boolean {
    if (href === "/console") return pathname === "/console" || pathname === "/console/";
    return pathname.startsWith(href);
  }

  onMount(async () => {
    initUx();
    try {
      await getRuntimeConfig();
    } catch {}

    try {
      const sessionData = await fetchSession();
      if (sessionData) {
        userRoles = sessionData.roles || [];
        userEmail = sessionData.email || "";
        userDisplayName = sessionData.displayName || sessionData.email || "";
        isImpersonating = sessionData.impersonating || false;
        impersonatedBy = sessionData.impersonatedBy || "";
      }
    } catch {}

    // Sync theme preference from DB
    syncThemeFromServer().catch(() => {});
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

  function titleCase(s: string): string {
    return s.replace(/\b\w/g, c => c.toUpperCase());
  }
</script>

<svelte:window on:click={handleClickOutside} />

<div class="flex min-h-dvh bg-background text-foreground">
  <a href="#main" class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[200] focus:bg-primary focus:text-primary-foreground focus:px-3 focus:py-1.5 focus:rounded-md focus:text-sm">
    Skip to content
  </a>

  <!-- Sidebar -->
  <aside class="hidden md:flex w-[240px] flex-col border-r bg-card shrink-0">
    <!-- Logo -->
    <div class="flex items-center gap-2 px-6 h-16 border-b">
      <div class="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
        <span class="text-primary-foreground font-bold text-sm">A</span>
      </div>
      <span class="font-semibold text-lg tracking-tight">AtlasIT</span>
    </div>

    {#if isImpersonating}
      <div class="mx-3 mt-3 bg-destructive text-destructive-foreground text-xs rounded-md px-3 py-2 flex items-center justify-between">
        <span>Viewing as tenant</span>
        <button on:click={exitImpersonation} class="text-[11px] bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded">Exit</button>
      </div>
    {/if}

    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto py-4 px-3 space-y-6">
      {#each computedSections as section}
        <div>
          <div class="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {section.title}
          </div>
          <div class="space-y-0.5">
            {#each section.items as item}
              {@const active = isActive(item.href, current)}
              <a
                href={item.href}
                class={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary border-l-2 border-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground border-l-2 border-transparent",
                )}
              >
                <svelte:component this={item.icon} class="h-4 w-4 shrink-0" />
                {item.label}
              </a>
            {/each}
          </div>
        </div>
      {/each}
    </nav>

    <!-- User section at bottom -->
    <div class="border-t p-3">
      <a href="/console/profile" class="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-accent transition-colors">
        <Avatar {initials} size="sm" />
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium truncate">{userDisplayName || "User"}</div>
          {#if userEmail && userEmail !== userDisplayName}
            <div class="text-xs text-muted-foreground truncate">{userEmail}</div>
          {/if}
        </div>
      </a>
    </div>
  </aside>

  <!-- Main area -->
  <div class="flex-1 min-w-0 flex flex-col">
    <!-- Topbar -->
    <header class="sticky top-0 z-30 flex items-center justify-between h-16 px-6 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <!-- Left: Breadcrumb area -->
      <div class="flex items-center gap-2 text-sm text-muted-foreground">
        <a href="/console" class="hover:text-foreground transition-colors">Console</a>
        {#if current !== "/console" && current !== "/console/"}
          <ChevronDown class="h-3 w-3 -rotate-90" />
          <span class="text-foreground font-medium">
            {titleCase(current.split("/").filter(Boolean).slice(1).join(" / ").replace(/-/g, " "))}
          </span>
        {/if}
      </div>

      <!-- Right: Actions -->
      <div class="flex items-center gap-1">
        <!-- Notifications -->
        <a
          href="/notifications"
          class="relative inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          title="Notifications"
          aria-label="Notifications"
        >
          <Bell class="h-[18px] w-[18px]" />
          {#if unreadCount > 0}
            <span class="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          {/if}
        </a>

        <!-- Theme toggle -->
        <button
          class="inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          on:click={toggleTheme}
          title="Toggle theme"
          aria-label="Toggle theme"
        >
          {#if t === "dark"}
            <Sun class="h-[18px] w-[18px]" />
          {:else}
            <Moon class="h-[18px] w-[18px]" />
          {/if}
        </button>

        <!-- Profile dropdown -->
        <div class="profile-dropdown-container relative ml-1">
          <button
            class="flex items-center gap-2 h-9 px-2 rounded-md hover:bg-accent transition-colors"
            on:click|stopPropagation={() => profileOpen = !profileOpen}
            aria-label="User menu"
            aria-expanded={profileOpen}
          >
            <Avatar {initials} size="sm" />
            <ChevronDown class="h-3 w-3 text-muted-foreground" />
          </button>

          {#if profileOpen}
            <div class="absolute top-full right-0 mt-1.5 w-64 rounded-lg border bg-card shadow-lg z-50 overflow-hidden">
              <div class="flex items-center gap-3 p-4">
                <Avatar {initials} size="lg" />
                <div class="min-w-0">
                  <div class="text-sm font-semibold truncate">{userDisplayName}</div>
                  {#if userEmail && userEmail !== userDisplayName}
                    <div class="text-xs text-muted-foreground truncate">{userEmail}</div>
                  {/if}
                </div>
              </div>
              <Separator />
              <a
                href="/console/profile"
                class="flex items-center gap-3 px-4 py-3 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                on:click={() => profileOpen = false}
              >
                <User class="h-4 w-4" />
                My Account
              </a>
              <a
                href="/console/settings"
                class="flex items-center gap-3 px-4 py-3 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                on:click={() => profileOpen = false}
              >
                <Settings class="h-4 w-4" />
                Settings
              </a>
              <button
                class="flex items-center gap-3 px-4 py-3 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors w-full text-left"
                on:click={signOut}
              >
                <LogOut class="h-4 w-4" />
                Sign Out
              </button>
            </div>
          {/if}
        </div>
      </div>
    </header>

    <!-- Main content -->
    <main class="flex-1 overflow-y-auto" id="main">
      <div class="max-w-[1280px] mx-auto px-6 py-8">
        <slot />
      </div>
      <ToastContainer />
    </main>
  </div>
</div>
