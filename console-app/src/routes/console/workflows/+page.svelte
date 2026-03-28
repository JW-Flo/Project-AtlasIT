<script lang="ts">
  import { onMount } from "svelte";
  import { push as pushToast } from "$lib/components/feedback/toastStore";
  import { integrations, iconMap } from "$lib/data/integrations";
  import Card from "$lib/components/ui/card.svelte";
  import CardContent from "$lib/components/ui/card-content.svelte";
  import CardHeader from "$lib/components/ui/card-header.svelte";
  import CardTitle from "$lib/components/ui/card-title.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Badge from "$lib/components/ui/badge.svelte";
  import Input from "$lib/components/ui/input.svelte";
  import Label from "$lib/components/ui/label.svelte";
  import Dialog from "$lib/components/ui/dialog.svelte";
  import DialogFooter from "$lib/components/ui/dialog-footer.svelte";
  import Tabs from "$lib/components/ui/tabs.svelte";
  import TabsList from "$lib/components/ui/tabs-list.svelte";
  import TabsTrigger from "$lib/components/ui/tabs-trigger.svelte";
  import Skeleton from "$lib/components/ui/skeleton.svelte";
  import {
    Link, ChevronDown, ChevronRight, Play, CheckCircle, XCircle, Minus,
    UserPlus, UserMinus, ArrowRightLeft, Users, Clock, Activity,
    Search, AlertTriangle,
  } from "lucide-svelte";

  interface WorkflowStep {
    name: string;
    description: string;
  }

  interface AppWorkflow {
    appId: string;
    appName: string;
    category: string;
    connected: boolean;
    joiner: WorkflowStep[];
    mover: WorkflowStep[];
    leaver: WorkflowStep[];
  }

  interface ExecutionResult {
    success: boolean;
    steps: { name: string; status: "success" | "failed" | "skipped" }[];
    message?: string;
  }

  interface DirectoryUser {
    id: string;
    email: string;
    displayName: string | null;
    department: string | null;
    title: string | null;
    status: string;
    createdAt: string;
    updatedAt: string;
  }

  interface WorkflowRun {
    id: string;
    type: string;
    status: string;
    subjectEmail: string;
    appId: string;
    startedAt: string;
    completedAt: string | null;
    stepsCompleted: number;
    stepsTotal: number;
  }

  interface ChangelogEntry {
    id: string;
    email: string;
    displayName: string | null;
    jmlAction: string;
    detail: string | null;
    createdAt: string;
  }

  function humanize(slug: string): string {
    return slug.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function toSteps(names: string[]): WorkflowStep[] {
    return names.map((n) => ({ name: humanize(n), description: n }));
  }

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }

  function appName(appId: string): string {
    return integrations.find((i) => i.id === appId)?.name || humanize(appId);
  }

  // Role types
  interface RoleRow {
    id: string;
    name: string;
    description: string | null;
    parentId: string | null;
    level: string;
    entitlementCount: number;
    assignmentCount: number;
    createdAt: string;
  }

  interface RoleDetail {
    id: string;
    name: string;
    description: string | null;
    parentId: string | null;
    level: string;
    entitlements: { id: string; appId: string; appRole: string }[];
    assignments: { id: string; targetType: string; targetId: string }[];
  }

  // State
  let loading = true;
  let activeTab = "policies";
  let idpSource = "okta";
  let searchQuery = "";

  // Collapsed sections on Lifecycle Policies tab
  let collapsedSections: Set<string> = new Set();
  function toggleSection(level: string) {
    if (collapsedSections.has(level)) {
      collapsedSections.delete(level);
    } else {
      collapsedSections.add(level);
    }
    collapsedSections = collapsedSections;
  }

  // Roles state
  let roles: RoleRow[] = [];
  let expandedRole: string | null = null;
  let roleDetail: RoleDetail | null = null;
  let loadingRoleDetail = false;
  let showCreateRole = false;
  let newRoleName = "";
  let newRoleDescription = "";
  let newRoleLevel: "org" | "department" | "team" = "team";
  let newRoleParentId = "";
  let creatingRole = false;

  // Data
  let workflows: AppWorkflow[] = [];
  let users: DirectoryUser[] = [];
  let runs: WorkflowRun[] = [];
  let changelog: ChangelogEntry[] = [];

  // Pipeline stats
  $: recentJoiners = users.filter((u) => {
    const created = new Date(u.createdAt).getTime();
    return u.status === "active" && Date.now() - created < 30 * 24 * 60 * 60 * 1000;
  });
  $: activeUsers = users.filter((u) => u.status === "active");
  $: inactiveUsers = users.filter((u) => u.status !== "active");
  $: recentRuns = runs.slice(0, 10);
  $: runsByType = {
    joiner: runs.filter((r) => r.type === "joiner").length,
    mover: runs.filter((r) => r.type === "mover").length,
    leaver: runs.filter((r) => r.type === "leaver").length,
  };

  // Modal state
  let showModal = false;
  let modalApp: AppWorkflow | null = null;
  let modalType: "joiner" | "mover" | "leaver" = "joiner";
  let modalEmail = "";
  let executing = false;
  let executionResult: ExecutionResult | null = null;

  // Mover-specific fields
  let moverNewDepartment = "";
  let moverNewTitle = "";
  let moverNewManager = "";
  let moverGroupsToAdd = "";
  let moverGroupsToRemove = "";
  let moverAppsToAdd = "";
  let moverAppsToRevoke = "";

  // Bulk selection
  let selectedUsers: Set<string> = new Set();
  let bulkType: "joiner" | "mover" | "leaver" = "joiner";
  let bulkProgress = 0;
  let bulkTotal = 0;

  // Leaver confirmation dialog
  let showLeaverConfirm = false;
  let leaverConfirmCallback: (() => void) | null = null;
  let leaverConfirmMessage = "";

  // User fetch error tracking
  let userFetchError = false;

  // App workflows
  $: connectedWorkflows = workflows.filter((w) => w.connected);
  $: filteredWorkflows = connectedWorkflows.filter(
    (w) => !searchQuery || w.appName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Filtered users for pipeline view
  let userSearch = "";
  let userStatusFilter = "all";
  $: filteredUsers = users.filter((u) => {
    if (userStatusFilter !== "all" && u.status !== userStatusFilter) return false;
    if (userSearch && !u.email.toLowerCase().includes(userSearch.toLowerCase()) &&
        !(u.displayName || "").toLowerCase().includes(userSearch.toLowerCase())) return false;
    return true;
  });

  const sectionColors: Record<string, string> = {
    joiner: "bg-green-500/10 text-green-500 border-green-500/20",
    mover: "bg-primary/10 text-primary border-primary/20",
    leaver: "bg-destructive/10 text-destructive border-destructive/20",
  };

  const idpSources = [
    { id: "okta", label: "Okta" },
    { id: "google_workspace", label: "Google Workspace" },
    { id: "active_directory", label: "Active Directory" },
    { id: "entra_id", label: "Entra ID" },
  ];

  // Roles computed
  $: orgRoles = roles.filter((r) => r.level === "org");
  $: deptRoles = roles.filter((r) => r.level === "department");
  $: teamRoles = roles.filter((r) => r.level === "team");

  async function loadAll() {
    loading = true;
    await Promise.all([fetchRoles(), fetchWorkflows(), fetchUsers(), fetchRuns(), fetchChangelog(), fetchIdpSource()]);
    loading = false;
  }

  async function fetchRoles() {
    try {
      const res = await fetch("/api/roles");
      if (res.ok) {
        const data = await res.json();
        roles = data.roles || [];
      }
    } catch { roles = []; }
  }

  async function toggleRoleExpand(roleId: string) {
    if (expandedRole === roleId) {
      expandedRole = null;
      roleDetail = null;
      return;
    }
    expandedRole = roleId;
    loadingRoleDetail = true;
    try {
      const res = await fetch(`/api/roles/${roleId}`);
      if (res.ok) {
        const data = await res.json();
        roleDetail = data.role;
      }
    } catch {
      roleDetail = null;
    }
    loadingRoleDetail = false;
  }

  async function createRole() {
    if (!newRoleName.trim()) return;
    creatingRole = true;
    try {
      const res = await fetch("/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newRoleName.trim(),
          description: newRoleDescription.trim() || null,
          level: newRoleLevel,
          parentId: newRoleParentId || null,
        }),
      });
      if (res.ok) {
        pushToast({ variant: "success", message: `Role "${newRoleName}" created` });
        showCreateRole = false;
        newRoleName = "";
        newRoleDescription = "";
        newRoleLevel = "team";
        newRoleParentId = "";
        await fetchRoles();
      } else {
        const data = await res.json();
        pushToast({ variant: "error", message: data.error || "Failed to create role" });
      }
    } catch {
      pushToast({ variant: "error", message: "Failed to create role" });
    }
    creatingRole = false;
  }

  async function fetchWorkflows() {
    try {
      const statusRes = await fetch("/api/apps/status");
      const statusData = statusRes.ok ? await statusRes.json() : { applications: [] };
      const connectedMap: Record<string, boolean> = {};
      for (const a of statusData.applications || []) {
        if (a.connected) connectedMap[a.id] = true;
      }

      const res = await fetch("/api/apps/lifecycle/workflows", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ scope: "all", idpSource }),
      });

      if (res.ok) {
        const data = await res.json();
        const apps = data.applications || data.workflows || [];
        if (Array.isArray(apps) && apps.length > 0) {
          workflows = apps.map((a: any) => ({
            appId: a.appId,
            appName: integrations.find((i) => i.id === a.appId)?.name || humanize(a.appId),
            category: a.category || "productivity",
            connected: !!connectedMap[a.appId] || !!a.connected,
            joiner: Array.isArray(a.joiner) ? toSteps(a.joiner) : [],
            mover: Array.isArray(a.mover) ? toSteps(a.mover) : [],
            leaver: Array.isArray(a.leaver) ? toSteps(a.leaver) : [],
          }));
        } else {
          useFallback(connectedMap);
        }
      } else {
        useFallback(connectedMap);
      }
    } catch {
      useFallback({});
    }
  }

  function useFallback(connectedMap: Record<string, boolean>) {
    workflows = integrations.map((app) => ({
      appId: app.id,
      appName: app.name,
      category: app.category,
      connected: !!connectedMap[app.id],
      joiner: [
        { name: "Provision account", description: `Create ${app.name} account` },
        { name: "Assign license", description: `Assign ${app.name} license` },
        { name: "Set permissions", description: `Configure ${app.name} permissions` },
      ],
      mover: [
        { name: "Review access", description: `Audit ${app.name} access` },
        { name: "Update permissions", description: `Adjust ${app.name} permissions` },
        { name: "Transfer ownership", description: `Transfer ${app.name} resources` },
      ],
      leaver: [
        { name: "Revoke access", description: `Disable ${app.name} account` },
        { name: "Backup data", description: `Archive ${app.name} data` },
        { name: "Remove license", description: `Deallocate ${app.name} license` },
      ],
    }));
  }

  async function fetchUsers() {
    userFetchError = false;
    try {
      const res = await fetch("/api/directory/users?limit=500");
      if (res.ok) {
        const data = await res.json();
        users = data.users || [];
      } else {
        userFetchError = true;
        users = [];
      }
    } catch {
      userFetchError = true;
      users = [];
    }
  }

  async function fetchRuns() {
    try {
      const res = await fetch("/api/jml/runs?limit=50");
      if (res.ok) {
        const data = await res.json();
        runs = data.runs || [];
      }
    } catch { runs = []; }
  }

  async function fetchChangelog() {
    try {
      const res = await fetch("/api/jml/changelog?limit=20");
      if (res.ok) {
        const data = await res.json();
        changelog = data.entries || [];
      }
    } catch { changelog = []; }
  }

  async function fetchIdpSource() {
    try {
      const res = await fetch("/api/directory/connect");
      if (res.ok) {
        const data = await res.json();
        if (data.provider) idpSource = data.provider;
      }
    } catch {}
  }

  function openRunModal(app: AppWorkflow, type: "joiner" | "mover" | "leaver") {
    modalApp = app;
    modalType = type;
    modalEmail = "";
    moverNewDepartment = "";
    moverNewTitle = "";
    moverNewManager = "";
    moverGroupsToAdd = "";
    moverGroupsToRemove = "";
    moverAppsToAdd = "";
    moverAppsToRevoke = "";
    executionResult = null;
    showModal = true;
  }

  function openRunForUser(user: DirectoryUser, type: "joiner" | "mover" | "leaver") {
    modalApp = connectedWorkflows[0] || null;
    modalType = type;
    modalEmail = user.email;
    executionResult = null;
    showModal = true;
  }

  function toggleUserSelection(userId: string) {
    if (selectedUsers.has(userId)) {
      selectedUsers.delete(userId);
    } else {
      selectedUsers.add(userId);
    }
    selectedUsers = new Set(selectedUsers);
  }

  function selectAllFiltered() {
    if (selectedUsers.size === filteredUsers.length) {
      selectedUsers = new Set();
    } else {
      selectedUsers = new Set(filteredUsers.map((u) => u.id));
    }
  }

  async function executeBulk() {
    const emails = users.filter((u) => selectedUsers.has(u.id)).map((u) => u.email);
    if (emails.length === 0) return;

    if (bulkType === "leaver") {
      leaverConfirmMessage = `This will run the leaver workflow for ${emails.length} user(s). This may revoke access irreversibly.`;
      leaverConfirmCallback = () => runBulkExecution(emails);
      showLeaverConfirm = true;
      return;
    }

    await runBulkExecution(emails);
  }

  async function runBulkExecution(emails: string[]) {
    executing = true;
    bulkProgress = 0;
    bulkTotal = emails.length;
    let succeeded = 0;
    let failed = 0;
    const failedEmails: string[] = [];

    for (const email of emails) {
      try {
        const res = await fetch("/api/workflows/execute", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ type: bulkType, subjectEmail: email, idpSource }),
        });
        if (res.ok) {
          succeeded++;
        } else {
          failed++;
          failedEmails.push(email);
        }
      } catch {
        failed++;
        failedEmails.push(email);
      }
      bulkProgress++;
    }

    executing = false;
    bulkProgress = 0;
    bulkTotal = 0;
    selectedUsers = new Set();
    const failedDetail = failedEmails.length > 0 ? ` (failed: ${failedEmails.slice(0, 3).join(", ")}${failedEmails.length > 3 ? ` +${failedEmails.length - 3} more` : ""})` : "";
    pushToast({
      message: `Bulk ${bulkType}: ${succeeded} succeeded, ${failed} failed${failedDetail}`,
      variant: failed > 0 ? "error" : "success",
    });
    fetchRuns();
    fetchChangelog();
  }

  async function executeWorkflow() {
    if (!modalApp || !modalEmail) return;

    if (modalType === "leaver") {
      leaverConfirmMessage = `This will revoke access for ${modalEmail} across all configured apps. This action may be irreversible.`;
      leaverConfirmCallback = () => runSingleExecution();
      showLeaverConfirm = true;
      return;
    }

    await runSingleExecution();
  }

  async function runSingleExecution() {
    if (!modalApp || !modalEmail) return;
    executing = true;
    executionResult = null;

    try {
      const res = await fetch("/api/workflows/execute", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          appId: modalApp.appId,
          type: modalType,
          subjectEmail: modalEmail,
          idpSource,
          ...(modalType === "mover" ? {
            moverContext: {
              newDepartment: moverNewDepartment || undefined,
              newTitle: moverNewTitle || undefined,
              newManager: moverNewManager || undefined,
              groupsToAdd: moverGroupsToAdd ? moverGroupsToAdd.split(",").map(s => s.trim()).filter(Boolean) : undefined,
              groupsToRemove: moverGroupsToRemove ? moverGroupsToRemove.split(",").map(s => s.trim()).filter(Boolean) : undefined,
              appsToAdd: moverAppsToAdd ? moverAppsToAdd.split(",").map(s => s.trim()).filter(Boolean) : undefined,
              appsToRevoke: moverAppsToRevoke ? moverAppsToRevoke.split(",").map(s => s.trim()).filter(Boolean) : undefined,
            },
          } : {}),
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        executionResult = {
          success: false,
          steps: [],
          message: data?.error || `Workflow failed (HTTP ${res.status})`,
        };
        pushToast({ message: `${modalType} workflow failed for ${modalEmail}`, variant: "error" });
      } else if (data?.steps) {
        executionResult = data;
        pushToast({ message: `${modalType} workflow completed for ${modalEmail}`, variant: "success" });
      } else {
        const steps = modalApp[modalType] || [];
        executionResult = {
          success: true,
          steps: steps.map((s: WorkflowStep) => ({ name: s.name, status: "success" as const })),
          message: `${modalType} workflow executed for ${modalEmail}`,
        };
        pushToast({ message: `${modalType} workflow completed for ${modalEmail}`, variant: "success" });
      }
    } catch {
      executionResult = {
        success: false,
        steps: [],
        message: "Workflow execution service unavailable",
      };
      pushToast({ message: "Workflow execution failed", variant: "error" });
    }
    executing = false;
  }

  // Selected run for deep link
  let selectedRunId: string | null = null;

  onMount(() => {
    // Parse URL params for tab and run deep linking
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    if (tabParam && ["policies", "pipeline", "apps", "activity"].includes(tabParam)) {
      activeTab = tabParam;
    }
    const runParam = params.get("run");
    if (runParam) {
      selectedRunId = runParam;
      activeTab = "activity";
    }
    loadAll();
  });
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">Lifecycle Workflows</h1>
      <p class="text-sm text-muted-foreground">
        Joiner / Mover / Leaver pipeline across your connected applications
      </p>
    </div>
    <div class="flex items-center gap-2">
      <select
        bind:value={idpSource}
        class="h-9 rounded-md border border-input bg-background px-3 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {#each idpSources as src}
          <option value={src.id}>{src.label}</option>
        {/each}
      </select>
    </div>
  </div>

  {#if loading}
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      {#each [1, 2, 3, 4] as _}
        <Skeleton class="h-24 rounded-lg" />
      {/each}
    </div>
    <Skeleton class="h-64 rounded-lg" />
  {:else}
    <!-- Pipeline Summary Cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent class="pt-5">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <UserPlus class="w-5 h-5 text-green-500" />
            </div>
            <div>
              <div class="text-2xl font-bold">{recentJoiners.length}</div>
              <div class="text-xs text-muted-foreground">New Joiners (30d)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="pt-5">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users class="w-5 h-5 text-primary" />
            </div>
            <div>
              <div class="text-2xl font-bold">{activeUsers.length}</div>
              <div class="text-xs text-muted-foreground">Active Users</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="pt-5">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <UserMinus class="w-5 h-5 text-destructive" />
            </div>
            <div>
              <div class="text-2xl font-bold">{inactiveUsers.length}</div>
              <div class="text-xs text-muted-foreground">Deactivated</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="pt-5">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Activity class="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <div class="text-2xl font-bold">{runs.length}</div>
              <div class="text-xs text-muted-foreground">Workflow Runs</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Visual Pipeline -->
    <Card>
      <CardContent class="pt-5 pb-2">
        <div class="flex items-center justify-center gap-2 md:gap-4">
          {#each [
            { type: "joiner", label: "Joiner", count: runsByType.joiner, icon: UserPlus, color: "text-green-500", bg: "bg-green-500/10 border-green-500/30" },
            { type: "mover", label: "Mover", count: runsByType.mover, icon: ArrowRightLeft, color: "text-primary", bg: "bg-primary/10 border-primary/30" },
            { type: "leaver", label: "Leaver", count: runsByType.leaver, icon: UserMinus, color: "text-destructive", bg: "bg-destructive/10 border-destructive/30" },
          ] as stage, i}
            {#if i > 0}
              <ChevronRight class="w-5 h-5 text-muted-foreground/40 shrink-0 hidden md:block" />
            {/if}
            <div class="flex-1 max-w-[200px] text-center rounded-lg border p-4 {stage.bg}">
              <svelte:component this={stage.icon} class="w-6 h-6 mx-auto mb-1.5 {stage.color}" />
              <div class="text-sm font-semibold {stage.color}">{stage.label}</div>
              <div class="text-xs text-muted-foreground mt-0.5">{stage.count} run{stage.count !== 1 ? "s" : ""}</div>
            </div>
          {/each}
        </div>
        <p class="text-[11px] text-muted-foreground text-center mt-3 mb-1">
          {connectedWorkflows.length} connected app{connectedWorkflows.length !== 1 ? "s" : ""} with lifecycle workflows configured
        </p>
      </CardContent>
    </Card>

    <!-- Tabs: Lifecycle Policies / Users / Activity -->
    <Tabs bind:value={activeTab}>
      <TabsList>
        <TabsTrigger value="policies" active={activeTab === "policies"} on:click={() => activeTab = "policies"}>Lifecycle Policies</TabsTrigger>
        <TabsTrigger value="pipeline" active={activeTab === "pipeline"} on:click={() => activeTab = "pipeline"}>Users</TabsTrigger>
        <TabsTrigger value="activity" active={activeTab === "activity"} on:click={() => activeTab = "activity"}>Activity</TabsTrigger>
      </TabsList>
    </Tabs>

    {#if activeTab === "policies"}
      <!-- Role-based lifecycle policies -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <p class="text-sm text-muted-foreground">
            Define which apps each role gets. When users join or leave, access is provisioned automatically.
          </p>
          <Button size="sm" on:click={() => showCreateRole = true}>
            <UserPlus class="w-4 h-4 mr-1" /> Create Role
          </Button>
        </div>

        {#if roles.length === 0}
          <Card class="border-dashed">
            <CardContent class="py-12 text-center text-muted-foreground">
              <Users class="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p class="text-lg font-medium">No lifecycle policies configured</p>
              <p class="text-sm mt-1">Create your first role to define which apps each team gets.</p>
              <Button class="mt-4" on:click={() => showCreateRole = true}>Create Role</Button>
            </CardContent>
          </Card>
        {:else}
          {#each [{ label: "Org-wide", level: "org", items: orgRoles }, { label: "Department", level: "department", items: deptRoles }, { label: "Team", level: "team", items: teamRoles }] as section}
            {#if section.items.length > 0}
              <div>
                <button type="button" class="flex items-center gap-2 mb-2 hover:text-foreground transition-colors" on:click={() => toggleSection(section.level)}>
                  {#if collapsedSections.has(section.level)}
                    <ChevronRight class="w-3.5 h-3.5 text-muted-foreground" />
                  {:else}
                    <ChevronDown class="w-3.5 h-3.5 text-muted-foreground" />
                  {/if}
                  <h3 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{section.label} ({section.items.length})</h3>
                </button>
                {#if !collapsedSections.has(section.level)}
                <div class="space-y-2">
                  {#each section.items as role}
                    <Card class="cursor-pointer hover:border-primary/30 transition-colors" on:click={() => toggleRoleExpand(role.id)}>
                      <CardContent class="p-4">
                        <div class="flex items-center justify-between">
                          <div class="flex items-center gap-3">
                            {#if expandedRole === role.id}
                              <ChevronDown class="w-4 h-4 text-muted-foreground" />
                            {:else}
                              <ChevronRight class="w-4 h-4 text-muted-foreground" />
                            {/if}
                            <div>
                              <span class="font-medium">{role.name}</span>
                              {#if role.description}
                                <span class="text-sm text-muted-foreground ml-2">— {role.description}</span>
                              {/if}
                            </div>
                          </div>
                          <div class="flex items-center gap-3 text-sm text-muted-foreground">
                            <span>{role.entitlementCount} app{role.entitlementCount !== 1 ? "s" : ""}</span>
                            <span class="text-xs">|</span>
                            <span>{role.assignmentCount} assigned</span>
                          </div>
                        </div>

                        {#if expandedRole === role.id}
                          <div class="mt-4 pt-3 border-t space-y-2">
                            {#if loadingRoleDetail}
                              <Skeleton class="h-8 w-full" />
                            {:else if roleDetail}
                              {#if roleDetail.entitlements.length === 0}
                                <p class="text-sm text-muted-foreground">No app entitlements configured. Add apps to this role.</p>
                              {:else}
                                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                  {#each roleDetail.entitlements as ent}
                                    <div class="flex items-center gap-2 p-2 rounded bg-muted/50">
                                      <span class="text-sm font-medium">{appName(ent.appId)}</span>
                                      <Badge variant="secondary" class="text-xs">{ent.appRole}</Badge>
                                    </div>
                                  {/each}
                                </div>
                              {/if}
                              <div class="flex gap-2 mt-2">
                                <Button size="sm" variant="outline" href={`/console/directory?tab=mappings&role=${role.id}`}>
                                  Manage Entitlements
                                </Button>
                              </div>
                            {/if}
                          </div>
                        {/if}
                      </CardContent>
                    </Card>
                  {/each}
                </div>
                {/if}
              </div>
            {/if}
          {/each}
        {/if}
      </div>
    {:else if activeTab === "pipeline"}
      <!-- User-centric pipeline view -->
      <div class="space-y-4">
        <div class="flex flex-wrap items-end gap-3">
          <div class="flex-1 max-w-sm">
            <Input type="text" bind:value={userSearch} placeholder="Search users..." />
          </div>
          <select
            bind:value={userStatusFilter}
            class="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
          {#if selectedUsers.size > 0}
            <div class="flex items-center gap-2">
              <Badge variant="secondary">{selectedUsers.size} selected</Badge>
              <select bind:value={bulkType} class="h-9 rounded-md border border-input bg-background px-2 text-xs">
                <option value="joiner">Joiner</option>
                <option value="mover">Mover</option>
                <option value="leaver">Leaver</option>
              </select>
              <Button size="sm" on:click={executeBulk} disabled={executing}>
                <Play class="w-3 h-3 mr-1" />
                {executing ? `Processing ${bulkProgress}/${bulkTotal}...` : `Run for ${selectedUsers.size}`}
              </Button>
            </div>
          {/if}
        </div>

        {#if userFetchError}
          <Card class="border-dashed border-destructive/30">
            <CardContent class="py-10 text-center">
              <AlertTriangle class="w-12 h-12 mx-auto mb-4 text-destructive/50" />
              <p class="text-lg font-semibold mb-1">Failed to load users</p>
              <p class="text-sm text-muted-foreground mb-5">Could not fetch directory users. Check your connection and try again.</p>
              <Button on:click={fetchUsers}>Retry</Button>
            </CardContent>
          </Card>
        {:else if users.length === 0}
          <Card class="border-dashed">
            <CardContent class="py-10 text-center">
              <Users class="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
              <p class="text-lg font-semibold mb-1">No directory users</p>
              <p class="text-sm text-muted-foreground mb-5">Sync your directory to see users in the lifecycle pipeline.</p>
              <a href="/console/directory">
                <Button>Go to Directory</Button>
              </a>
            </CardContent>
          </Card>
        {:else}
          <Card>
            <CardContent class="p-0">
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="text-left text-muted-foreground text-xs uppercase tracking-wider border-b">
                      <th class="px-4 py-2.5 font-medium w-8">
                        <input
                          type="checkbox"
                          checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                          on:change={selectAllFiltered}
                          class="rounded"
                        />
                      </th>
                      <th class="px-4 py-2.5 font-medium">User</th>
                      <th class="px-4 py-2.5 font-medium hidden md:table-cell">Department</th>
                      <th class="px-4 py-2.5 font-medium">Status</th>
                      <th class="px-4 py-2.5 font-medium hidden lg:table-cell">Added</th>
                      <th class="px-4 py-2.5 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {#each filteredUsers.slice(0, 50) as user}
                      <tr class="border-t hover:bg-muted/50 {selectedUsers.has(user.id) ? 'bg-primary/5' : ''}">
                        <td class="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedUsers.has(user.id)}
                            on:change={() => toggleUserSelection(user.id)}
                            class="rounded"
                          />
                        </td>
                        <td class="px-4 py-3">
                          <div>
                            <div class="font-medium">{user.displayName || user.email}</div>
                            {#if user.displayName}
                              <div class="text-xs text-muted-foreground">{user.email}</div>
                            {/if}
                          </div>
                        </td>
                        <td class="px-4 py-3 text-muted-foreground hidden md:table-cell">
                          {user.department || "—"}
                        </td>
                        <td class="px-4 py-3">
                          <Badge variant={user.status === "active" ? "success" : user.status === "suspended" ? "warning" : "secondary"}>
                            {user.status}
                          </Badge>
                        </td>
                        <td class="px-4 py-3 text-muted-foreground text-xs hidden lg:table-cell">
                          {timeAgo(user.createdAt)}
                        </td>
                        <td class="px-4 py-3 text-right">
                          <div class="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              class="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors bg-green-500/10 text-green-500 hover:bg-green-500/20"
                              on:click={() => openRunForUser(user, "joiner")}
                              title="Run joiner workflow"
                            >
                              <UserPlus class="w-3 h-3" />
                              J
                            </button>
                            <button
                              type="button"
                              class="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors bg-primary/10 text-primary hover:bg-primary/20"
                              on:click={() => openRunForUser(user, "mover")}
                              title="Run mover workflow"
                            >
                              <ArrowRightLeft class="w-3 h-3" />
                              M
                            </button>
                            <button
                              type="button"
                              class="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors bg-destructive/10 text-destructive hover:bg-destructive/20"
                              on:click={() => openRunForUser(user, "leaver")}
                              title="Run leaver workflow"
                            >
                              <UserMinus class="w-3 h-3" />
                              L
                            </button>
                          </div>
                        </td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
              {#if filteredUsers.length > 50}
                <div class="px-4 py-3 text-xs text-muted-foreground border-t text-center">
                  Showing 50 of {filteredUsers.length} users. Use search to narrow results.
                </div>
              {/if}
            </CardContent>
          </Card>
        {/if}
      </div>

    {:else if activeTab === "apps"}
      <!-- App workflow view -->
      <div class="space-y-4">
        <Input type="text" bind:value={searchQuery} placeholder="Filter apps..." class="max-w-sm" />

        {#if connectedWorkflows.length === 0}
          <Card class="border-dashed">
            <CardContent class="py-10 text-center">
              <Link class="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
              <p class="text-lg font-semibold mb-1">No connected apps</p>
              <p class="text-sm text-muted-foreground mb-5">Connect applications from the Marketplace to enable JML workflows.</p>
              <a href="/console/marketplace">
                <Button>Browse Marketplace</Button>
              </a>
            </CardContent>
          </Card>
        {:else}
          <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {#each filteredWorkflows as app}
              <Card class="hover:border-primary/30 transition-colors">
                <CardContent class="pt-5">
                  <div class="flex items-center gap-3 mb-4">
                    <div class="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/10">
                      <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d={iconMap[app.category] || iconMap.productivity} />
                      </svg>
                    </div>
                    <div>
                      <div class="font-semibold">{app.appName}</div>
                      <div class="text-xs text-muted-foreground capitalize">{app.category}</div>
                    </div>
                  </div>
                  <div class="space-y-2">
                    {#each [
                      { type: "joiner" as const, label: "Joiner", color: "text-green-500" },
                      { type: "mover" as const, label: "Mover", color: "text-primary" },
                      { type: "leaver" as const, label: "Leaver", color: "text-destructive" },
                    ] as wf}
                      {@const steps = app[wf.type] || []}
                      <div class="flex items-center justify-between px-3 py-2 rounded-md bg-muted/50">
                        <div class="flex items-center gap-2">
                          <span class="text-xs font-medium {wf.color}">{wf.label}</span>
                          <Badge variant="secondary" class="text-[10px]">{steps.length} steps</Badge>
                        </div>
                        <Button variant="ghost" size="sm" class="h-7 px-2 text-xs" on:click={() => openRunModal(app, wf.type)}>
                          <Play class="w-3 h-3 mr-1" /> Run
                        </Button>
                      </div>
                    {/each}
                  </div>
                </CardContent>
              </Card>
            {/each}
          </div>
        {/if}
      </div>

    {:else if activeTab === "activity"}
      <!-- Unified activity: Workflow Runs + Changelog -->
      <div class="space-y-6">
        <!-- Workflow Runs Table -->
        <Card>
          <CardHeader>
            <CardTitle class="text-base">Workflow Runs</CardTitle>
          </CardHeader>
          <CardContent class="p-0">
            {#if runs.length === 0}
              <p class="text-sm text-muted-foreground text-center py-6">No workflow runs yet</p>
            {:else}
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="text-left text-muted-foreground text-xs uppercase tracking-wider border-b">
                      <th class="px-4 py-3 font-medium">Type</th>
                      <th class="px-4 py-3 font-medium">User</th>
                      <th class="px-4 py-3 font-medium">Status</th>
                      <th class="px-4 py-3 font-medium hidden md:table-cell">Steps</th>
                      <th class="px-4 py-3 font-medium text-right">When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {#each runs as run}
                      <tr
                        class="border-t hover:bg-muted/50 transition-colors cursor-pointer {selectedRunId === run.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''}"
                        on:click={() => selectedRunId = selectedRunId === run.id ? null : run.id}
                      >
                        <td class="px-4 py-3">
                          <Badge variant={run.type === "joiner" ? "success" : run.type === "leaver" ? "destructive" : "default"} class="capitalize">{run.type}</Badge>
                        </td>
                        <td class="px-4 py-3">{run.subjectEmail || run.email || "—"}</td>
                        <td class="px-4 py-3">
                          <Badge variant={run.status === "completed" || run.status === "success" ? "success" : run.status === "failed" ? "destructive" : "info"} class="capitalize">{run.status}</Badge>
                        </td>
                        <td class="px-4 py-3 text-muted-foreground hidden md:table-cell">{run.stepsCompleted ?? run.stepsDone ?? 0}/{run.stepsTotal ?? 0}</td>
                        <td class="px-4 py-3 text-right">
                          <span class="text-muted-foreground" title={run.startedAt ? new Date(run.startedAt).toLocaleString() : ''}>{run.startedAt ? timeAgo(run.startedAt) : '—'}</span>
                        </td>
                      </tr>
                      {#if selectedRunId === run.id}
                        <tr class="bg-muted/20 border-l-4 border-l-primary/40">
                          <td colspan="5" class="px-4 py-4">
                            <div class="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                              <div>
                                <span class="font-semibold text-muted-foreground">Run ID</span>
                                <div class="font-mono mt-0.5 break-all">{run.id}</div>
                              </div>
                              <div>
                                <span class="font-semibold text-muted-foreground">Started</span>
                                <div class="mt-0.5">{run.startedAt ? new Date(run.startedAt).toLocaleString() : '—'}</div>
                              </div>
                              <div>
                                <span class="font-semibold text-muted-foreground">Completed</span>
                                <div class="mt-0.5">{run.completedAt ? new Date(run.completedAt).toLocaleString() : '—'}</div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      {/if}
                    {/each}
                  </tbody>
                </table>
              </div>
            {/if}
          </CardContent>
        </Card>

        <!-- Directory Changelog -->
        <Card>
          <CardHeader>
            <CardTitle class="text-base">Directory Changes</CardTitle>
          </CardHeader>
          <CardContent>
            {#if changelog.length === 0}
              <p class="text-sm text-muted-foreground text-center py-6">No directory changes recorded</p>
            {:else}
              <div class="space-y-2">
                {#each changelog as entry}
                  <div class="flex items-center gap-3 px-3 py-2.5 rounded-md bg-muted/50">
                    {#if entry.jmlAction === "joiner" || entry.jmlAction === "created"}
                      <UserPlus class="w-4 h-4 text-green-500 shrink-0" />
                    {:else if entry.jmlAction === "leaver" || entry.jmlAction === "deactivated"}
                      <UserMinus class="w-4 h-4 text-destructive shrink-0" />
                    {:else}
                      <ArrowRightLeft class="w-4 h-4 text-primary shrink-0" />
                    {/if}
                    <div class="flex-1 min-w-0">
                      <div class="text-xs font-medium truncate">{entry.displayName || entry.email}</div>
                      <div class="text-[11px] text-muted-foreground">
                        {entry.jmlAction} • {timeAgo(entry.createdAt)}
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          </CardContent>
        </Card>
      </div>
    {/if}
  {/if}
</div>

<!-- Run Workflow Modal -->
<Dialog open={showModal} onClose={() => showModal = false} title="Run Workflow{modalApp ? ` — ${modalApp.appName}` : ''}">
  {#if modalApp}
    {#if !executionResult}
      <div class="space-y-4">
        <div class="space-y-1.5">
          <Label>Workflow Type</Label>
          <div class="flex gap-2">
            {#each ["joiner", "mover", "leaver"] as t}
              <button
                type="button"
                class="flex-1 py-2 text-xs font-medium rounded capitalize transition-colors border {modalType === t
                  ? sectionColors[t]
                  : 'bg-muted text-muted-foreground border-transparent'}"
                on:click={() => modalType = t}
              >
                {t}
              </button>
            {/each}
          </div>
        </div>

        <div class="space-y-1.5">
          <Label>Target App</Label>
          <select
            bind:value={modalApp}
            class="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {#each connectedWorkflows as app}
              <option value={app}>{app.appName}</option>
            {/each}
          </select>
        </div>

        <div class="space-y-1.5">
          <Label>Subject Email</Label>
          <Input type="email" bind:value={modalEmail} placeholder="user@company.com" />
        </div>

        {#if modalType === "mover"}
          <div class="space-y-3 rounded-md border border-border p-3">
            <p class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Role & Group Changes</p>
            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1">
                <Label class="text-xs">New Department</Label>
                <Input type="text" bind:value={moverNewDepartment} placeholder="Engineering" class="h-8 text-xs" />
              </div>
              <div class="space-y-1">
                <Label class="text-xs">New Title</Label>
                <Input type="text" bind:value={moverNewTitle} placeholder="Senior Engineer" class="h-8 text-xs" />
              </div>
              <div class="col-span-2 space-y-1">
                <Label class="text-xs">New Manager</Label>
                <Input type="email" bind:value={moverNewManager} placeholder="manager@company.com" class="h-8 text-xs" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1">
                <Label class="text-xs">Groups to Add</Label>
                <Input type="text" bind:value={moverGroupsToAdd} placeholder="eng-team, devops" class="h-8 text-xs" />
              </div>
              <div class="space-y-1">
                <Label class="text-xs">Groups to Remove</Label>
                <Input type="text" bind:value={moverGroupsToRemove} placeholder="sales-team" class="h-8 text-xs" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1">
                <Label class="text-xs">Apps to Provision</Label>
                <Input type="text" bind:value={moverAppsToAdd} placeholder="github, jira" class="h-8 text-xs" />
              </div>
              <div class="space-y-1">
                <Label class="text-xs">Apps to Revoke</Label>
                <Input type="text" bind:value={moverAppsToRevoke} placeholder="salesforce" class="h-8 text-xs" />
              </div>
            </div>
          </div>
        {/if}

        {#if modalApp[modalType]?.length}
          <div>
            <p class="text-xs text-muted-foreground mb-2">Steps ({modalApp[modalType].length})</p>
            <div class="space-y-1">
              {#each modalApp[modalType] as step, i}
                <div class="flex items-center gap-2 text-xs px-2 py-1.5 rounded bg-muted">
                  <span class="font-mono text-[10px] text-muted-foreground shrink-0">{i + 1}.</span>
                  {step.name}
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <Button class="w-full" on:click={executeWorkflow} disabled={executing || !modalEmail}>
          {executing ? "Executing..." : `Run ${modalType} workflow`}
        </Button>
      </div>
    {:else}
      <div class="space-y-3">
        <div class="flex items-center gap-2 mb-2">
          {#if executionResult.success}
            <CheckCircle class="w-5 h-5 text-green-500" />
            <span class="text-sm font-medium text-green-500">Workflow completed</span>
          {:else}
            <XCircle class="w-5 h-5 text-destructive" />
            <span class="text-sm font-medium text-destructive">Workflow failed</span>
          {/if}
        </div>
        {#if executionResult.message}
          <p class="text-xs text-muted-foreground">{executionResult.message}</p>
        {/if}
        {#each executionResult.steps as step}
          <div class="flex items-center gap-2 px-3 py-2 rounded bg-muted">
            {#if step.status === "success"}
              <CheckCircle class="w-4 h-4 text-green-500 shrink-0" />
            {:else if step.status === "failed"}
              <XCircle class="w-4 h-4 text-destructive shrink-0" />
            {:else}
              <Minus class="w-4 h-4 text-muted-foreground shrink-0" />
            {/if}
            <span class="text-xs">{step.name}</span>
          </div>
        {/each}
        <DialogFooter>
          <Button variant="secondary" on:click={() => showModal = false}>Close</Button>
        </DialogFooter>
      </div>
    {/if}
  {/if}
</Dialog>

<!-- Leaver Confirmation Dialog -->
<Dialog open={showLeaverConfirm} onClose={() => { showLeaverConfirm = false; leaverConfirmCallback = null; }}>
  <div class="space-y-4">
    <h3 class="text-lg font-semibold text-destructive">Confirm Leaver Workflow</h3>
    <p class="text-sm text-muted-foreground">{leaverConfirmMessage}</p>
    <DialogFooter>
      <Button variant="outline" on:click={() => { showLeaverConfirm = false; leaverConfirmCallback = null; }}>Cancel</Button>
      <Button variant="destructive" on:click={() => { showLeaverConfirm = false; if (leaverConfirmCallback) leaverConfirmCallback(); leaverConfirmCallback = null; }}>Continue</Button>
    </DialogFooter>
  </div>
</Dialog>

<!-- Create Role Modal -->
<Dialog open={showCreateRole} onClose={() => showCreateRole = false}>
  <div class="space-y-4">
    <h3 class="text-lg font-semibold">Create Lifecycle Role</h3>
    <p class="text-sm text-muted-foreground">Roles define which apps users get when they join, move, or leave.</p>
    <div class="space-y-3">
      <div>
        <Label>Role Name</Label>
        <Input bind:value={newRoleName} placeholder="e.g., Engineer, Sales Rep, Manager" />
      </div>
      <div>
        <Label>Description</Label>
        <Input bind:value={newRoleDescription} placeholder="Optional description" />
      </div>
      <div>
        <Label>Level</Label>
        <select bind:value={newRoleLevel} class="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
          <option value="org">Org-wide (applies to all employees)</option>
          <option value="department">Department</option>
          <option value="team">Team</option>
        </select>
      </div>
      {#if roles.length > 0}
        <div>
          <Label>Inherits From (optional)</Label>
          <select bind:value={newRoleParentId} class="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">None</option>
            {#each roles as r}
              <option value={r.id}>{r.name} ({r.level})</option>
            {/each}
          </select>
        </div>
      {/if}
    </div>
    <DialogFooter>
      <Button variant="outline" on:click={() => showCreateRole = false}>Cancel</Button>
      <Button on:click={createRole} disabled={creatingRole || !newRoleName.trim()}>
        {creatingRole ? "Creating..." : "Create Role"}
      </Button>
    </DialogFooter>
  </div>
</Dialog>
