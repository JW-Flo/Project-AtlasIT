<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import {
    ShieldCheck,
    Database,
    Zap,
    AlertTriangle,
    Plug,
    TrendingUp,
    FileCheck,
    CheckCircle2,
    XCircle,
    Clock,
    Users,
    KeyRound,
    Activity,
    BarChart3,
    ChevronRight,
  } from "lucide-svelte";
  import { DEMO_MODULES, DEMO_TENANT, DEMO_MARKETPLACE, type DemoNavModule } from "$lib/demo/data";

  export let authenticated = false;

  let activeModule: DemoNavModule = "dashboard";
  let liveCompliance = DEMO_TENANT.complianceScore;
  let liveAutomations = DEMO_TENANT.automationsToday;
  let liveIncidents = DEMO_TENANT.openIncidents;

  const ctas = authenticated
    ? [
        { label: "Start Free Trial", href: "/pricing", event: "requested_trial", primary: true },
        { label: "Explore Sandbox", href: "/console", event: "clicked_cta", primary: false },
      ]
    : [
        { label: "Start Free Trial", href: "/signup", event: "requested_trial", primary: true },
        { label: "Book Demo", href: "/support", event: "booked_demo", primary: false },
      ];

  async function track(event: string, module: string | null = null) {
    try {
      await fetch("/api/demo/events", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ event, module }),
      });
    } catch {}
  }

  function selectModule(mod: DemoNavModule) {
    activeModule = mod;
    track("explored_module", mod);
  }

  let interval: ReturnType<typeof setInterval> | undefined;

  onMount(() => {
    track("viewed_demo");
    interval = setInterval(() => {
      liveCompliance = Math.min(96, liveCompliance + 1);
      liveAutomations += 1;
    }, 6000);
  });

  onDestroy(() => {
    if (interval) clearInterval(interval);
  });

  const frameworks = [
    { name: "HIPAA", score: 89, passing: 31, total: 36, color: "bg-blue-500" },
    { name: "SOC 2", score: 83, passing: 42, total: 48, color: "bg-violet-500" },
  ];

  const recentActivity = [
    { icon: CheckCircle2, color: "text-green-500", msg: "New-hire onboarding completed — Dr. Maya Lin", time: "Just now" },
    { icon: Zap, color: "text-violet-500", msg: "Device quarantine flow triggered automatically", time: "4m ago" },
    { icon: FileCheck, color: "text-blue-500", msg: "SOC 2 evidence collected — Okta login events (128 items)", time: "12m ago" },
    { icon: AlertTriangle, color: "text-amber-500", msg: "MFA bypass attempt detected — investigating", time: "31m ago" },
  ];

  const complianceControls = [
    { id: "CC6.1", name: "Logical access controls", status: "verified", framework: "SOC 2" },
    { id: "CC7.2", name: "System monitoring", status: "verified", framework: "SOC 2" },
    { id: "§164.312(a)", name: "Access control", status: "implemented", framework: "HIPAA" },
    { id: "§164.308(a)(5)", name: "Security awareness training", status: "in_progress", framework: "HIPAA" },
    { id: "CC9.1", name: "Risk mitigation", status: "verified", framework: "SOC 2" },
    { id: "§164.310(c)", name: "Workstation security", status: "implemented", framework: "HIPAA" },
  ];

  const directoryUsers = [
    { name: "Dr. Maya Lin", email: "maya.lin@acmedental.com", role: "Dentist", status: "active", mfa: true },
    { name: "James Reyes", email: "james.reyes@acmedental.com", role: "Office Manager", status: "active", mfa: true },
    { name: "Sarah Park", email: "sarah.park@acmedental.com", role: "Dental Hygienist", status: "active", mfa: false },
    { name: "Tom Nguyen", email: "tom.nguyen@acmedental.com", role: "IT Admin", status: "active", mfa: true },
    { name: "Lisa Chen", email: "lisa.chen@acmedental.com", role: "Receptionist", status: "offboarding", mfa: false },
  ];

  const automationRules = [
    { name: "Onboard Dentist", trigger: "User created", runs: 12, lastRun: "Just now", status: "active" },
    { name: "Offboard Contractor", trigger: "User deactivated", runs: 9, lastRun: "2h ago", status: "active" },
    { name: "Slack access request", trigger: "Access requested", runs: 6, lastRun: "18m ago", status: "active" },
    { name: "Device quarantine", trigger: "Risk threshold exceeded", runs: 2, lastRun: "4m ago", status: "active" },
    { name: "MFA non-compliance alert", trigger: "MFA disabled", runs: 1, lastRun: "3d ago", status: "active" },
  ];

  const incidents = [
    { title: "MFA bypass attempt", severity: "critical", status: "investigating", source: "Identity", time: "31m ago" },
    { title: "Terminated employee access removed", severity: "medium", status: "resolved", source: "Automation", time: "2h ago" },
    { title: "Suspicious login blocked", severity: "high", status: "resolved", source: "Automation", time: "5h ago" },
  ];

  const severityColor: Record<string, string> = {
    critical: "bg-red-100 text-red-700",
    high: "bg-orange-100 text-orange-700",
    medium: "bg-amber-100 text-amber-700",
    low: "bg-slate-100 text-slate-600",
  };

  const statusColor: Record<string, string> = {
    investigating: "bg-amber-100 text-amber-700",
    resolved: "bg-green-100 text-green-700",
    open: "bg-red-100 text-red-700",
  };

  const controlStatusColor: Record<string, string> = {
    verified: "bg-green-100 text-green-700",
    implemented: "bg-blue-100 text-blue-700",
    in_progress: "bg-amber-100 text-amber-700",
    not_started: "bg-slate-100 text-slate-500",
  };
</script>

<div class="min-h-screen bg-slate-50 text-slate-900 pb-20">
  <!-- Top nav bar -->
  <div class="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between sticky top-0 z-10">
    <div class="flex items-center gap-2.5">
      <div class="h-7 w-7 rounded-lg bg-violet-600 flex items-center justify-center shrink-0">
        <ShieldCheck class="h-4 w-4 text-white" strokeWidth={2.5} />
      </div>
      <span class="font-semibold text-slate-900 text-sm">AtlasIT</span>
      <span class="hidden sm:inline-flex items-center rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-700">Demo</span>
    </div>
    <div class="flex items-center gap-3">
      <span class="hidden sm:block text-xs text-slate-500">{DEMO_TENANT.name}</span>
      <div class="h-7 w-7 rounded-full bg-violet-100 flex items-center justify-center text-xs font-semibold text-violet-700">AD</div>
    </div>
  </div>

  <div class="mx-auto max-w-5xl px-4 pt-5">
    <!-- Module tabs -->
    <div class="mb-5 flex gap-1 overflow-x-auto no-scrollbar">
      {#each DEMO_MODULES as mod}
        <button
          class="shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap {activeModule === mod.id
            ? 'bg-[hsl(252,87%,58%)] text-white shadow-sm'
            : 'text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm'}"
          on:click={() => selectModule(mod.id)}
        >{mod.label}</button>
      {/each}
    </div>

    <!-- ── DASHBOARD ─────────────────────────────────────────────── -->
    {#if activeModule === 'dashboard'}
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-4">
        <!-- Compliance hero -->
        <div class="col-span-2 rounded-xl bg-white border border-slate-200 p-5 shadow-sm">
          <p class="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Overall Compliance</p>
          <div class="flex items-end gap-3">
            <span class="text-5xl font-bold text-green-600">{liveCompliance}%</span>
            <span class="mb-1 flex items-center gap-1 text-xs font-medium text-green-600">
              <TrendingUp class="h-3.5 w-3.5" /> +3% this week
            </span>
          </div>
          <div class="mt-3 h-1.5 w-full rounded-full bg-slate-100">
            <div class="h-1.5 rounded-full bg-green-500 transition-all duration-700" style="width: {liveCompliance}%"></div>
          </div>
          <div class="mt-3 flex gap-4">
            {#each frameworks as fw}
              <div class="text-xs">
                <span class="font-medium text-slate-700">{fw.name}</span>
                <span class="ml-1 text-slate-500">{fw.score}%</span>
              </div>
            {/each}
          </div>
        </div>

        <!-- Stat cards -->
        <div class="rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
          <div class="flex items-center gap-2 mb-2">
            <div class="rounded-md bg-violet-50 p-1.5"><Zap class="h-3.5 w-3.5 text-violet-600" /></div>
            <p class="text-xs text-slate-500">Automations</p>
          </div>
          <p class="text-2xl font-bold text-slate-900">{liveAutomations}</p>
          <p class="text-xs text-slate-400 mt-0.5">today</p>
        </div>

        <div class="rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
          <div class="flex items-center gap-2 mb-2">
            <div class="rounded-md bg-amber-50 p-1.5"><AlertTriangle class="h-3.5 w-3.5 text-amber-500" /></div>
            <p class="text-xs text-slate-500">Incidents</p>
          </div>
          <p class="text-2xl font-bold text-amber-600">{liveIncidents}</p>
          <p class="text-xs text-slate-400 mt-0.5">open</p>
        </div>

        <div class="rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
          <div class="flex items-center gap-2 mb-2">
            <div class="rounded-md bg-blue-50 p-1.5"><Database class="h-3.5 w-3.5 text-blue-500" /></div>
            <p class="text-xs text-slate-500">Evidence</p>
          </div>
          <p class="text-2xl font-bold text-slate-900">243</p>
          <p class="text-xs text-slate-400 mt-0.5">collected</p>
        </div>

        <div class="rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
          <div class="flex items-center gap-2 mb-2">
            <div class="rounded-md bg-slate-100 p-1.5"><Plug class="h-3.5 w-3.5 text-slate-500" /></div>
            <p class="text-xs text-slate-500">Integrations</p>
          </div>
          <p class="text-2xl font-bold text-slate-900">{DEMO_TENANT.appsConnected}</p>
          <p class="text-xs text-slate-400 mt-0.5">connected</p>
        </div>
      </div>

      <!-- Activity feed -->
      <div class="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div class="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 class="text-sm font-semibold text-slate-900">Recent Activity</h3>
          <span class="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
            <span class="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>Live
          </span>
        </div>
        <div class="divide-y divide-slate-50">
          {#each recentActivity as item}
            <div class="flex items-start gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
              <svelte:component this={item.icon} class="mt-0.5 h-4 w-4 shrink-0 {item.color}" />
              <p class="flex-1 text-sm text-slate-700 min-w-0">{item.msg}</p>
              <span class="shrink-0 text-xs text-slate-400">{item.time}</span>
            </div>
          {/each}
        </div>
      </div>

    <!-- ── COMPLIANCE ─────────────────────────────────────────────── -->
    {:else if activeModule === 'compliance'}
      <div class="space-y-3">
        <!-- Framework scores -->
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {#each frameworks as fw}
            <div class="rounded-xl bg-white border border-slate-200 p-5 shadow-sm">
              <div class="flex items-center justify-between mb-3">
                <span class="text-sm font-semibold text-slate-900">{fw.name}</span>
                <span class="text-2xl font-bold text-green-600">{fw.score}%</span>
              </div>
              <div class="h-1.5 w-full rounded-full bg-slate-100">
                <div class="h-1.5 rounded-full {fw.color} transition-all" style="width: {fw.score}%"></div>
              </div>
              <div class="mt-2 flex gap-3 text-xs text-slate-500">
                <span class="text-green-600 font-medium">{fw.passing} passing</span>
                <span>{fw.total - fw.passing} remaining</span>
                <span>{fw.total} total controls</span>
              </div>
            </div>
          {/each}
        </div>

        <!-- Controls table -->
        <div class="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div class="px-5 py-3 border-b border-slate-100">
            <h3 class="text-sm font-semibold text-slate-900">Controls</h3>
          </div>
          <div class="divide-y divide-slate-50">
            {#each complianceControls as ctrl}
              <div class="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                <span class="shrink-0 text-xs font-mono text-slate-400 w-28">{ctrl.id}</span>
                <span class="flex-1 text-sm text-slate-800 min-w-0 truncate">{ctrl.name}</span>
                <span class="shrink-0 text-xs rounded-full px-2 py-0.5 font-medium {controlStatusColor[ctrl.status]}">{ctrl.status.replace('_', ' ')}</span>
                <span class="hidden sm:block shrink-0 text-xs text-slate-400">{ctrl.framework}</span>
              </div>
            {/each}
          </div>
        </div>
      </div>

    <!-- ── IDENTITY ────────────────────────────────────────────────── -->
    {:else if activeModule === 'identity'}
      <div class="space-y-3">
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div class="rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
            <p class="text-xs text-slate-500 mb-1">Total users</p>
            <p class="text-2xl font-bold text-slate-900">{DEMO_TENANT.employees}</p>
          </div>
          <div class="rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
            <p class="text-xs text-slate-500 mb-1">MFA coverage</p>
            <p class="text-2xl font-bold text-green-600">95%</p>
          </div>
          <div class="rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
            <p class="text-xs text-slate-500 mb-1">Offboarding</p>
            <p class="text-2xl font-bold text-amber-600">1</p>
          </div>
          <div class="rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
            <p class="text-xs text-slate-500 mb-1">Orphaned accts</p>
            <p class="text-2xl font-bold text-slate-900">0</p>
          </div>
        </div>

        <div class="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div class="px-5 py-3 border-b border-slate-100">
            <h3 class="text-sm font-semibold text-slate-900">Directory</h3>
          </div>
          <div class="divide-y divide-slate-50">
            {#each directoryUsers as user}
              <div class="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                <div class="h-7 w-7 shrink-0 rounded-full bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-600">
                  {user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-slate-900 truncate">{user.name}</p>
                  <p class="text-xs text-slate-400 truncate hidden sm:block">{user.email}</p>
                </div>
                <span class="hidden sm:block text-xs text-slate-500">{user.role}</span>
                {#if !user.mfa}
                  <span class="shrink-0 text-xs rounded-full bg-amber-50 px-2 py-0.5 text-amber-700 font-medium">No MFA</span>
                {/if}
                <span class="shrink-0 text-xs rounded-full px-2 py-0.5 font-medium {user.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}">{user.status}</span>
              </div>
            {/each}
          </div>
        </div>
      </div>

    <!-- ── AUTOMATION ─────────────────────────────────────────────── -->
    {:else if activeModule === 'automation'}
      <div class="space-y-3">
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div class="rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
            <p class="text-xs text-slate-500 mb-1">Active rules</p>
            <p class="text-2xl font-bold text-slate-900">5</p>
          </div>
          <div class="rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
            <p class="text-xs text-slate-500 mb-1">Executions today</p>
            <p class="text-2xl font-bold text-violet-600">{liveAutomations}</p>
          </div>
          <div class="col-span-2 sm:col-span-1 rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
            <p class="text-xs text-slate-500 mb-1">Success rate</p>
            <p class="text-2xl font-bold text-green-600">98.2%</p>
          </div>
        </div>

        <div class="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div class="px-5 py-3 border-b border-slate-100">
            <h3 class="text-sm font-semibold text-slate-900">Automation Rules</h3>
          </div>
          <div class="divide-y divide-slate-50">
            {#each automationRules as rule}
              <div class="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                <div class="rounded-md bg-violet-50 p-1.5 shrink-0"><Zap class="h-3.5 w-3.5 text-violet-600" /></div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-slate-900">{rule.name}</p>
                  <p class="text-xs text-slate-400">{rule.trigger}</p>
                </div>
                <div class="hidden sm:block text-right shrink-0">
                  <p class="text-xs font-medium text-slate-700">{rule.runs} runs</p>
                  <p class="text-xs text-slate-400">{rule.lastRun}</p>
                </div>
                <span class="shrink-0 h-2 w-2 rounded-full bg-green-500"></span>
              </div>
            {/each}
          </div>
        </div>
      </div>

    <!-- ── INCIDENTS ──────────────────────────────────────────────── -->
    {:else if activeModule === 'incidents'}
      <div class="space-y-3">
        <div class="grid grid-cols-3 gap-3">
          <div class="rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
            <p class="text-xs text-slate-500 mb-1">Open</p>
            <p class="text-2xl font-bold text-red-600">1</p>
          </div>
          <div class="rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
            <p class="text-xs text-slate-500 mb-1">Investigating</p>
            <p class="text-2xl font-bold text-amber-600">1</p>
          </div>
          <div class="rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
            <p class="text-xs text-slate-500 mb-1">Resolved today</p>
            <p class="text-2xl font-bold text-green-600">2</p>
          </div>
        </div>

        <div class="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div class="px-5 py-3 border-b border-slate-100">
            <h3 class="text-sm font-semibold text-slate-900">Incidents</h3>
          </div>
          <div class="divide-y divide-slate-50">
            {#each incidents as inc}
              <div class="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                <AlertTriangle class="h-4 w-4 shrink-0 {inc.severity === 'critical' ? 'text-red-500' : inc.severity === 'high' ? 'text-orange-500' : 'text-amber-500'}" />
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-slate-900">{inc.title}</p>
                  <p class="text-xs text-slate-400">{inc.source} · {inc.time}</p>
                </div>
                <span class="shrink-0 text-xs rounded-full px-2 py-0.5 font-medium {severityColor[inc.severity]}">{inc.severity}</span>
                <span class="hidden sm:block shrink-0 text-xs rounded-full px-2 py-0.5 font-medium {statusColor[inc.status]}">{inc.status}</span>
              </div>
            {/each}
          </div>
        </div>
      </div>

    <!-- ── ANALYTICS ──────────────────────────────────────────────── -->
    {:else if activeModule === 'analytics'}
      <div class="space-y-3">
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div class="rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
            <p class="text-xs text-slate-500 mb-1">Hours saved / mo</p>
            <p class="text-2xl font-bold text-violet-600">117</p>
          </div>
          <div class="rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
            <p class="text-xs text-slate-500 mb-1">Risk reduction</p>
            <p class="text-2xl font-bold text-green-600">−18%</p>
          </div>
          <div class="rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
            <p class="text-xs text-slate-500 mb-1">Automation rate</p>
            <p class="text-2xl font-bold text-slate-900">98.2%</p>
          </div>
          <div class="rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
            <p class="text-xs text-slate-500 mb-1">Compliance δ</p>
            <p class="text-2xl font-bold text-green-600">+9%</p>
          </div>
        </div>
        <div class="rounded-xl bg-white border border-slate-200 p-5 shadow-sm">
          <h3 class="text-sm font-semibold text-slate-900 mb-4">Compliance score — 30 day trend</h3>
          <div class="flex items-end gap-1 h-20">
            {#each [77, 78, 79, 79, 80, 81, 81, 82, 82, 83, 83, 84, 84, 84, 85, 85, 85, 86, 86, 86, 86, 87, 87, 87, 87, 87, 88, 88, 89, liveCompliance] as val, i}
              <div
                class="flex-1 rounded-t-sm bg-violet-500 opacity-80 transition-all"
                style="height: {((val - 75) / 25) * 100}%"
                title="{val}%"
              ></div>
            {/each}
          </div>
          <div class="mt-2 flex justify-between text-xs text-slate-400">
            <span>30d ago</span><span>Today · {liveCompliance}%</span>
          </div>
        </div>
      </div>

    <!-- ── MARKETPLACE ────────────────────────────────────────────── -->
    {:else}
      <div class="space-y-3">
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {#each [
            { name: "Okta", category: "Identity", status: "connected", color: "bg-blue-50 text-blue-700" },
            { name: "Google Workspace", category: "Directory", status: "connected", color: "bg-red-50 text-red-700" },
            { name: "Slack", category: "Comms", status: "connected", color: "bg-amber-50 text-amber-700" },
            { name: "Intune", category: "Device", status: "connected", color: "bg-blue-50 text-blue-700" },
            { name: "CrowdStrike", category: "Endpoint", status: "connected", color: "bg-red-50 text-red-700" },
            { name: "Microsoft 365", category: "Productivity", status: "available", color: "bg-slate-50 text-slate-600" },
          ] as app}
            <div class="rounded-xl bg-white border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <div class="flex items-start justify-between gap-2 mb-2">
                <span class="text-sm font-semibold text-slate-900">{app.name}</span>
                <span class="shrink-0 text-xs rounded-full px-2 py-0.5 font-medium {app.status === 'connected' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}">{app.status}</span>
              </div>
              <p class="text-xs text-slate-500">{app.category}</p>
            </div>
          {/each}
        </div>
        <p class="text-center text-xs text-slate-400">35 integrations available in full product</p>
      </div>
    {/if}
  </div>
</div>

<!-- Bottom CTA bar -->
<div class="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white shadow-sm">
  <div class="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
    <p class="hidden sm:block text-xs text-slate-500">Try AtlasIT with your own data.</p>
    <div class="flex w-full sm:w-auto gap-2 justify-center sm:justify-end">
      {#each ctas as cta}
        <a
          href={cta.href}
          class="whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors {cta.primary
            ? 'bg-[hsl(252,87%,58%)] text-white hover:bg-[hsl(252,87%,50%)] shadow-sm'
            : 'border border-slate-200 text-slate-700 hover:bg-slate-50'}"
          on:click={() => track(cta.event)}
        >{cta.label}</a>
      {/each}
    </div>
  </div>
</div>
