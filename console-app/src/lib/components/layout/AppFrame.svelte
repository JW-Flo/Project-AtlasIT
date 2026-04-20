<script lang="ts">
  import { cn } from "$lib/utils";
  import { theme, setTheme, syncThemeFromServer } from "../../stores/theme";
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { init as initUx } from "../../instrumentation/ux-metrics";
  import ToastContainer from "../feedback/ToastContainer.svelte";
  import CopilotPanel from "../copilot/CopilotPanel.svelte";
  import Avatar from "../ui/avatar.svelte";
  import Separator from "../ui/separator.svelte";
  import { getRuntimeConfig } from "../../config";
  import { isDemoMode } from "$lib/demo/state";
  import DemoModePill from "$lib/demo/DemoModePill.svelte";
  import DemoTour from "$lib/demo/DemoTour.svelte";
  import { startTour, getTourState } from "$lib/demo/tour-store";
  import { session as sessionStore, fetchSession, refreshSession } from "../../stores/session";
  import { complianceScore, fetchComplianceScore, refreshComplianceScore, clearComplianceCache, hydrateComplianceScore } from "../../stores/compliance";
  import { preferences, fetchPreferences } from "../../stores/preferences";
  import Breadcrumb from "../ui/breadcrumb.svelte";
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
    ClipboardCheck,
    FileCheck,
    Zap,
    Menu,
    X,
    Search,
    Lightbulb,
    BarChart3,
    Sparkles,
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

  /** Server-side session data passed from +layout.server.ts */
  export let serverSession: any = null;

  let userRoles: string[] = [];
  let isSuperAdmin = false;
  let userEmail = "";
  let userDisplayName = "";
  let isImpersonating = false;
  let impersonatedBy = "";
  let orgName = "";
  let logoUrl = "";
  let accentColor = "";
  const demoMode = isDemoMode();

  const navSections: NavSection[] = [
    {
      title: "Overview",
      items: [
        { href: "/console", label: "Dashboard", icon: LayoutDashboard },
        { href: "/console/directory", label: "Directory", icon: Users },
      ],
    },
    {
      title: "Compliance",
      items: [
        { href: "/console/compliance", label: "Overview", icon: ShieldCheck },
        { href: "/console/compliance/packs", label: "Packs", icon: FolderCog },
        { href: "/console/compliance/controls", label: "Controls", icon: ShieldCheck },
        { href: "/console/compliance/evidence", label: "Evidence", icon: Activity },
        { href: "/console/compliance/attestations", label: "Attestations", icon: FileCheck },
        { href: "/console/compliance/audit-package", label: "Audit Package", icon: FileText },
        { href: "/console/policies", label: "Policies", icon: FileText },
      ],
    },
    {
      title: "Security",
      items: [
        { href: "/console/access-reviews", label: "Access Reviews", icon: ClipboardCheck },
        { href: "/console/access-requests", label: "Access Requests", icon: KeyRound },
        { href: "/console/incidents", label: "Incidents", icon: AlertTriangle },
        { href: "/console/nhi", label: "NHI Governance", icon: ShieldCheck },
        { href: "/console/jml/changelog", label: "JML Changelog", icon: FileText },
      ],
    },
    {
      title: "Automation",
      items: [
        { href: "/console/workflows", label: "Workflows", icon: Workflow },
        { href: "/console/automation", label: "Rules", icon: Zap },
        { href: "/console/automation/runs", label: "Runs", icon: Workflow },
      ],
    },
    {
      title: "Apps",
      items: [
        { href: "/console/apps", label: "Connected Apps", icon: AppWindow },
        { href: "/console/marketplace", label: "Marketplace", icon: Store },
        { href: "/console/discovery", label: "Discovery", icon: Search },
      ],
    },
    {
      title: "System",
      items: [
        { href: "/console/audit", label: "Audit Log", icon: FileText },
        { href: "/console/platform-status", label: "Platform Status", icon: Activity },
        { href: "/console/settings", label: "Settings", icon: Settings },
      ],
    },
  ];

  $: computedSections = isSuperAdmin || userRoles.includes("super-admin")
    ? [...navSections.slice(0, -1), {
        ...navSections[navSections.length - 1],
        items: [
          ...navSections[navSections.length - 1].items,
          { href: "/console/admin", label: "Admin", icon: Shield },
          { href: "/console/admin/operations", label: "Operations", icon: Activity },
        ],
      }]
    : navSections;

  async function exitImpersonation() {
    clearComplianceCache();
    await fetch("/api/admin/impersonate/exit", { method: "POST" });
    location.href = "/console/admin";
  }

  $: current = $page.url.pathname;

  // Collect all nav hrefs for precise active-state matching
  $: allNavHrefs = computedSections.flatMap((s) => s.items.map((i) => i.href));

  // Generate breadcrumb segments from current path
  $: breadcrumbSegments = (() => {
    const parts = current.split("/").filter(Boolean);
    if (parts[0] === "console") parts.shift(); // Remove "console" prefix
    if (parts.length === 0) return [{ label: "Dashboard", href: undefined }];

    return parts.map((part, i) => {
      const label = part.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      const href = i === parts.length - 1 ? undefined : `/console/${parts.slice(0, i + 1).join("/")}`;
      return { label, href };
    });
  })();

  function isActive(href: string, pathname: string): boolean {
    if (href === "/console") return pathname === "/console" || pathname === "/console/";
    if (!pathname.startsWith(href)) return false;
    // If another nav item has a longer prefix that also matches, this one isn't active
    // e.g. on /console/compliance/feed, /console/compliance should NOT highlight
    for (const other of allNavHrefs) {
      if (other !== href && other.startsWith(href) && pathname.startsWith(other)) {
        return false;
      }
    }
    return true;
  }

  // Only allow safe CSS color values to prevent injection via stored branding
  function sanitizeColor(color: string): string {
    const trimmed = color.trim();
    if (/^#[0-9a-fA-F]{3,8}$/.test(trimmed)) return trimmed; // hex
    if (/^rgb[a]?\([^)]+\)$/.test(trimmed)) return trimmed;   // rgb/rgba
    if (/^hsl[a]?\([^)]+\)$/.test(trimmed)) return trimmed;   // hsl/hsla
    if (/^[a-zA-Z]{2,30}$/.test(trimmed)) return trimmed;      // named color
    return "";
  }

  function applyBranding(logo: string, accent: string) {
    logoUrl = logo;
    accentColor = sanitizeColor(accent);
    if (typeof document !== "undefined") {
      if (accentColor) {
        document.documentElement.style.setProperty("--accent-brand", accentColor);
      } else {
        document.documentElement.style.removeProperty("--accent-brand");
      }
    }
  }

  function applySessionData(sessionData: any) {
    if (!sessionData?.authenticated) return;
    userRoles = sessionData.roles || [];
    isSuperAdmin = sessionData.superAdmin || false;
    userEmail = sessionData.email || "";
    userDisplayName = sessionData.displayName || sessionData.email || "User";
    isImpersonating = sessionData.impersonating || false;
    impersonatedBy = sessionData.impersonatedBy || "";
    orgName = sessionData.orgName || "";
    applyBranding(sessionData.branding?.logoUrl || "", sessionData.branding?.accentColor || "");
    // Populate the shared session store so child pages can react to it.
    // Only set on client — during SSR, child reactive blocks would trigger
    // fetch calls that fail or hang during server rendering.
    if (typeof window !== "undefined") {
      sessionStore.set(sessionData);
    }
  }

  async function loadSession(force = false) {
    const sessionData = await (force ? refreshSession() : fetchSession());
    applySessionData(sessionData);
  }

  // Reactively apply session data whenever serverSession changes (e.g., after login navigates via goto)
  $: if (serverSession?.authenticated) {
    applySessionData(serverSession);
  }

  onMount(async () => {
    initUx();
    try {
      await getRuntimeConfig();
    } catch {}

    // If server session wasn't available, fall back to client-side fetch
    if (!serverSession?.authenticated) {
      try {
        await loadSession();
      } catch {}
    }

    // Re-apply branding whenever settings page saves new values
    const onBrandingUpdated = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (detail) {
        // Apply branding directly from the saved values
        applyBranding(detail.logoUrl || "", detail.accentColor || "");
      } else {
        // Fallback: refetch session
        loadSession(true).catch(() => {});
      }
    };
    window.addEventListener("branding-updated", onBrandingUpdated);

    // Sync theme preference from DB
    syncThemeFromServer().catch(() => {});

    // Fetch user preferences (help icons, etc.)
    fetchPreferences().catch(() => {});

    // Use server-prefetched compliance scores when available, else fetch client-side
    const prefetchedScores = $page.data?.complianceScores;
    if (prefetchedScores) {
      hydrateComplianceScore(prefetchedScores);
    } else {
      fetchComplianceScore().catch(() => {});
    }

    if (demoMode) {
      const ts = getTourState();
      if (!ts.active && !ts.completed) startTour();
    }

    return () => window.removeEventListener("branding-updated", onBrandingUpdated);
  });

  // Poll compliance score every 60s
  let compliancePollTimer: ReturnType<typeof setInterval>;
  onMount(() => {
    compliancePollTimer = setInterval(() => {
      refreshComplianceScore().catch(() => {});
    }, 60000);
    return () => clearInterval(compliancePollTimer);
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
  let mobileMenuOpen = false;
  let sidebarCollapsed = false;
  let copilotOpen = false;

  // Persist sidebar state in localStorage
  if (typeof window !== "undefined") {
    sidebarCollapsed = localStorage.getItem("sidebar-collapsed") === "true";
  }

  function toggleSidebar() {
    sidebarCollapsed = !sidebarCollapsed;
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebar-collapsed", String(sidebarCollapsed));
    }
  }

  function closeMobileMenu() {
    mobileMenuOpen = false;
  }

  // Close mobile menu on navigation
  $: if (current) {
    mobileMenuOpen = false;
  }

  function handleClickOutside(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (!target.closest(".profile-dropdown-container")) {
      profileOpen = false;
    }
  }

  function handleCopilotShortcut(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      copilotOpen = !copilotOpen;
    }
  }

  $: initials = userDisplayName
    ? userDisplayName.split(/[\s@]/).filter(Boolean).slice(0, 2).map((s) => s[0].toUpperCase()).join("")
    : "?";

  async function signOut() {
    clearComplianceCache();
    // Delegate to /logout — it clears sessionStorage, posts /api/auth/logout,
    // and redirects to /login. Keeps teardown logic in one place.
    location.href = "/logout";
  }

  const ACRONYMS = new Set(["nhi", "jml", "sso", "mfa", "api", "sla", "ai", "rbac", "oidc", "saml", "scim"]);
  function titleCase(s: string): string {
    return s.replace(/\b\w+/g, w => ACRONYMS.has(w.toLowerCase()) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1));
  }
</script>

<svelte:window on:click={handleClickOutside} on:keydown={handleCopilotShortcut} />

<div class="flex h-dvh bg-background text-foreground overflow-hidden">
  <a href="#main" class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[200] focus:bg-primary focus:text-primary-foreground focus:px-3 focus:py-1.5 focus:rounded-md focus:text-sm">
    Skip to content
  </a>

  <!-- Sidebar -->
  <aside class="hidden md:flex flex-col border-r border-border bg-card shrink-0 sidebar-transition {sidebarCollapsed ? 'w-[64px]' : 'w-[256px]'}">
    <!-- Logo -->
    <a
      href="/console"
      class="flex items-center gap-2.5 h-16 border-b border-border hover:bg-accent/40 transition-colors {sidebarCollapsed ? 'px-4 justify-center' : 'px-5'}"
      title={sidebarCollapsed ? (orgName || 'AtlasIT') : ''}
    >
      {#if logoUrl}
        <img src={logoUrl} alt="{orgName || 'Organization'} logo" class="h-8 w-8 rounded-lg object-cover shrink-0 ring-1 ring-border" />
      {:else}
        <div
          class="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center shrink-0 shadow-sm"
          style={accentColor ? `background: ${accentColor}` : ''}
        >
          <span class="text-primary-foreground font-semibold text-[13px]">{orgName ? orgName[0].toUpperCase() : 'A'}</span>
        </div>
      {/if}
      {#if !sidebarCollapsed}
        <div class="min-w-0 flex-1">
          <div class="font-semibold text-[15px] tracking-tight text-foreground truncate leading-tight">{orgName || 'AtlasIT'}</div>
          <div class="text-2xs text-muted-foreground truncate">Compliance Platform</div>
        </div>
      {/if}
    </a>

    {#if isImpersonating && !sidebarCollapsed}
      <div class="mx-3 mt-3 bg-destructive-muted border border-destructive/30 text-destructive text-xs rounded-lg px-3 py-2 flex items-center justify-between">
        <span class="font-medium">Viewing as tenant</span>
        <button
          on:click={exitImpersonation}
          class="text-2xs font-semibold bg-destructive text-destructive-foreground hover:bg-destructive/90 px-2 py-0.5 rounded transition-colors"
        >Exit</button>
      </div>
    {/if}

    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto py-4 {sidebarCollapsed ? 'px-2' : 'px-3'} space-y-5">
      {#each computedSections as section}
        <div>
          {#if !sidebarCollapsed}
            <div class="px-2 mb-1.5 text-2xs font-semibold uppercase tracking-wider text-muted-foreground/80">
              {section.title}
            </div>
          {/if}
          <div class="space-y-0.5">
            {#each section.items as item}
              {@const active = isActive(item.href, current)}
              <a
                href={item.href}
                title={sidebarCollapsed ? item.label : ''}
                class={cn(
                  "group relative flex items-center rounded-lg text-sm font-medium transition-all duration-fast",
                  sidebarCollapsed ? "justify-center px-2 py-2" : "gap-2.5 px-2.5 py-1.5",
                  active
                    ? "nav-active bg-primary-muted text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
                style={active && accentColor ? `color: ${accentColor}; background-color: color-mix(in srgb, ${accentColor} 12%, transparent)` : ""}
              >
                {#if active && !sidebarCollapsed}
                  <span
                    class="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r bg-primary"
                    style={accentColor ? `background-color: ${accentColor}` : ''}
                    aria-hidden="true"
                  ></span>
                {/if}
                <svelte:component
                  this={item.icon}
                  class={cn("h-[17px] w-[17px] shrink-0 transition-colors", active ? "" : "text-muted-foreground/70 group-hover:text-foreground")}
                  strokeWidth={active ? 2.25 : 1.85}
                />
                {#if !sidebarCollapsed}
                  <span class="truncate">{item.label}</span>
                {/if}
              </a>
            {/each}
          </div>
        </div>
      {/each}
    </nav>

    <!-- Collapse toggle -->
    <div class="border-t border-border {sidebarCollapsed ? 'px-2' : 'px-3'} py-2">
      <button
        on:click={toggleSidebar}
        class="flex items-center {sidebarCollapsed ? 'justify-center' : 'gap-2.5 px-2.5'} w-full rounded-lg py-1.5 text-2xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <ChevronDown class="h-3.5 w-3.5 shrink-0 {sidebarCollapsed ? 'rotate-[-90deg]' : 'rotate-90'} transition-transform" />
        {#if !sidebarCollapsed}
          <span>Collapse</span>
        {/if}
      </button>
    </div>

    <!-- User section at bottom -->
    <div class="border-t border-border {sidebarCollapsed ? 'p-2' : 'p-3'}">
      <a
        href="/console/profile"
        class="flex items-center {sidebarCollapsed ? 'justify-center' : 'gap-2.5 px-2'} rounded-lg py-2 hover:bg-accent transition-colors group"
        title={sidebarCollapsed ? userDisplayName : ''}
      >
        <Avatar {initials} size="sm" />
        {#if !sidebarCollapsed}
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium truncate text-foreground">{userDisplayName || "User"}</div>
            {#if userEmail && userEmail !== userDisplayName}
              <div class="text-2xs text-muted-foreground truncate">{userEmail}</div>
            {/if}
          </div>
        {/if}
      </a>
    </div>
  </aside>

  <!-- Mobile drawer overlay -->
  {#if mobileMenuOpen}
    <div class="fixed inset-0 z-40 md:hidden">
      <!-- Backdrop -->
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div
        class="absolute inset-0 bg-black/50 backdrop-blur-sm"
        on:click={closeMobileMenu}
      ></div>

      <!-- Drawer panel -->
      <aside class="absolute inset-y-0 left-0 w-[280px] max-w-[85vw] flex flex-col bg-card border-r shadow-xl overflow-y-auto">
        <!-- Logo -->
        <div class="flex items-center justify-between gap-2 px-4 h-16 border-b shrink-0">
          <a href="/console" class="flex items-center gap-2" on:click={closeMobileMenu}>
            {#if logoUrl}
              <img src={logoUrl} alt="{orgName || 'Organization'} logo" class="h-8 w-8 rounded-lg object-cover" />
            {:else}
              <div class="h-8 w-8 rounded-lg bg-primary flex items-center justify-center" style={accentColor ? `background-color: ${accentColor}` : ''}>
                <span class="text-primary-foreground font-bold text-sm">{orgName ? orgName[0].toUpperCase() : 'A'}</span>
              </div>
            {/if}
            <span class="font-semibold text-lg tracking-tight">{orgName || 'AtlasIT'}</span>
          </a>
          <button
            class="inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            on:click={closeMobileMenu}
            aria-label="Close navigation menu"
          >
            <X class="h-5 w-5" />
          </button>
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
                    on:click={closeMobileMenu}
                    class={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors border-l-2",
                      active
                        ? "bg-[color-mix(in_srgb,var(--accent-brand,hsl(var(--primary)))_10%,transparent)] border-l-[var(--accent-brand,hsl(var(--primary)))]"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground border-transparent",
                    )}
                    style={active && accentColor ? `color: ${accentColor}` : ""}
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
        <div class="border-t p-3 shrink-0">
          <a href="/console/profile" on:click={closeMobileMenu} class="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-accent transition-colors">
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
    </div>
  {/if}

  <!-- Main area -->
  <div class="flex-1 min-w-0 flex flex-col">
    <!-- Topbar -->
    <header class="sticky top-0 z-30 flex items-center justify-between h-14 px-4 md:px-5 border-b border-border bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <!-- Left: Hamburger + Breadcrumb -->
      <div class="flex items-center gap-1.5 text-sm text-muted-foreground min-w-0">
        <button
          class="inline-flex md:hidden items-center justify-center h-9 w-9 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors -ml-1"
          on:click={() => mobileMenuOpen = !mobileMenuOpen}
          aria-label="Toggle navigation menu"
          aria-expanded={mobileMenuOpen}
        >
          {#if mobileMenuOpen}
            <X class="h-5 w-5" />
          {:else}
            <Menu class="h-5 w-5" />
          {/if}
        </button>
        <Breadcrumb segments={breadcrumbSegments} />
      </div>

      <!-- Right: Actions -->
      <div class="flex items-center gap-0.5">
        <!-- Notifications -->
        <a
          href="/notifications"
          class="relative inline-flex items-center justify-center h-9 w-9 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          title="Notifications"
          aria-label="Notifications"
        >
          <Bell class="h-[17px] w-[17px]" strokeWidth={1.85} />
          {#if unreadCount > 0}
            <span class="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-semibold flex items-center justify-center ring-2 ring-background">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          {/if}
        </a>

        <!-- Compliance Score Pill -->
        {#if demoMode}
          <div class="mx-1.5">
            <DemoModePill />
          </div>
        {/if}

        {#if $complianceScore}
          {@const score = $complianceScore.overallScore}
          {@const tone = score >= 80 ? 'success' : score >= 60 ? 'warning' : 'destructive'}
          <a
            href="/console/compliance"
            data-tour="compliance-pill"
            class="hidden md:inline-flex items-center gap-1.5 h-7 px-2.5 mx-1.5 rounded-full text-xs font-medium transition-all duration-fast
              {tone === 'success' ? 'bg-success-muted text-success hover:bg-success-muted/80' : ''}
              {tone === 'warning' ? 'bg-warning-muted text-warning hover:bg-warning-muted/80' : ''}
              {tone === 'destructive' ? 'bg-destructive-muted text-destructive hover:bg-destructive-muted/80' : ''}"
            title="Compliance: {$complianceScore.frameworks.map(f => `${f.framework} ${f.grade} (${f.score}%)`).join(', ')}"
            aria-label="Compliance score: {$complianceScore.grade} {$complianceScore.overallScore}%"
          >
            <span class="h-1.5 w-1.5 rounded-full
              {tone === 'success' ? 'bg-success' : ''}
              {tone === 'warning' ? 'bg-warning' : ''}
              {tone === 'destructive' ? 'bg-destructive' : ''}"></span>
            <span class="font-semibold">{$complianceScore.grade}</span>
            <span class="text-2xs opacity-70 tabular-nums">{score}%</span>
          </a>
        {/if}

        <!-- Copilot toggle -->
        <button
          class="inline-flex items-center justify-center h-9 w-9 rounded-lg transition-colors {copilotOpen ? 'bg-primary-muted text-primary' : 'hover:bg-accent text-muted-foreground hover:text-foreground'}"
          on:click={() => copilotOpen = !copilotOpen}
          title="Compliance Copilot (Cmd+K)"
          aria-label="Toggle compliance copilot"
        >
          <Sparkles class="h-[17px] w-[17px]" strokeWidth={1.85} />
        </button>

        <!-- Theme toggle -->
        <button
          class="inline-flex items-center justify-center h-9 w-9 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          on:click={toggleTheme}
          title="Toggle theme"
          aria-label="Toggle theme"
        >
          {#if t === "dark"}
            <Sun class="h-[17px] w-[17px]" strokeWidth={1.85} />
          {:else}
            <Moon class="h-[17px] w-[17px]" strokeWidth={1.85} />
          {/if}
        </button>

        <!-- Profile dropdown -->
        <div class="profile-dropdown-container relative ml-1.5 pl-1.5 border-l border-border">
          <button
            class="flex items-center gap-1.5 h-9 px-1.5 rounded-lg hover:bg-accent transition-colors"
            on:click|stopPropagation={() => profileOpen = !profileOpen}
            aria-label="User menu"
            aria-expanded={profileOpen}
          >
            <Avatar {initials} size="sm" />
            <ChevronDown class="h-3 w-3 text-muted-foreground" />
          </button>

          {#if profileOpen}
            <div
              class="absolute top-full right-0 mt-2 w-64 rounded-xl border border-border bg-popover shadow-lg z-50 overflow-hidden animate-scale-in origin-top-right"
            >
              <div class="flex items-center gap-3 p-4 border-b border-border">
                <Avatar {initials} size="lg" />
                <div class="min-w-0">
                  <div class="text-sm font-semibold truncate text-foreground">{userDisplayName}</div>
                  {#if userEmail && userEmail !== userDisplayName}
                    <div class="text-xs text-muted-foreground truncate">{userEmail}</div>
                  {/if}
                </div>
              </div>
              <div class="py-1">
                <a
                  href="/console/profile"
                  class="flex items-center gap-2.5 px-3 py-2 mx-1 text-sm text-foreground hover:bg-accent rounded-md transition-colors"
                  on:click={() => profileOpen = false}
                >
                  <User class="h-4 w-4 text-muted-foreground" strokeWidth={1.85} />
                  My Account
                </a>
                <a
                  href="/console/settings"
                  class="flex items-center gap-2.5 px-3 py-2 mx-1 text-sm text-foreground hover:bg-accent rounded-md transition-colors"
                  on:click={() => profileOpen = false}
                >
                  <Settings class="h-4 w-4 text-muted-foreground" strokeWidth={1.85} />
                  Settings
                </a>
              </div>
              <div class="py-1 border-t border-border">
                <button
                  class="flex items-center gap-2.5 px-3 py-2 mx-1 text-sm text-foreground hover:bg-destructive-muted hover:text-destructive rounded-md transition-colors w-full text-left"
                  on:click={signOut}
                >
                  <LogOut class="h-4 w-4" strokeWidth={1.85} />
                  Sign Out
                </button>
              </div>
            </div>
          {/if}
        </div>
      </div>
    </header>

    <!-- Main content -->
    <main class="flex-1 overflow-y-auto bg-background" id="main">
      <div class="container-page py-6 md:py-8">
        <slot />
      </div>
      <ToastContainer />
      <!-- Footer -->
      <footer class="container-page py-6 mt-8 border-t border-border text-center text-2xs text-muted-foreground/80">
        <div class="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <span>&copy; {new Date().getFullYear()} AtlasIT</span>
          <span class="text-muted-foreground/40">·</span>
          <a href="/privacy" class="hover:text-foreground transition-colors">Privacy</a>
          <a href="/privacy/dsar" class="hover:text-foreground transition-colors">Data Requests</a>
          <a href="/terms" class="hover:text-foreground transition-colors">Terms</a>
          <a href="/support" class="hover:text-foreground transition-colors">Support</a>
          <a href="https://status.atlasit.pro" class="hover:text-foreground transition-colors">Status</a>
        </div>
      </footer>
    </main>
  </div>

  <!-- Copilot Panel -->
  <CopilotPanel bind:open={copilotOpen} onClose={() => copilotOpen = false} />

  {#if demoMode}
    <DemoTour />
  {/if}
</div>

<style>
  :global(.nav-active) {
    color: var(--accent-brand, hsl(var(--primary))) !important;
    border-color: var(--accent-brand, hsl(var(--primary))) !important;
    background-color: color-mix(in srgb, var(--accent-brand, hsl(var(--primary))) 10%, transparent) !important;
  }
  .sidebar-transition {
    transition: width 200ms ease-in-out;
  }
</style>
